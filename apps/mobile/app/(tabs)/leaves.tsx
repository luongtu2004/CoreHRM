import { useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, ScrollView, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import DatePickerField from '../../src/components/DatePickerField';
import {
  Calendar, Plus, X, Clock, CheckCircle, XCircle,
  Send, AlertCircle, Trash2, ChevronRight
} from 'lucide-react-native';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:   { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7', icon: Clock },
  APPROVED:  { label: 'Đã duyệt',  color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle },
  REJECTED:  { label: 'Từ chối',   color: '#ef4444', bg: '#fef2f2', icon: XCircle },
  CANCELLED: { label: 'Đã hủy',   color: '#64748b', bg: '#f8fafc', icon: X },
};

export default function LeavesScreen() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [formData, setFormData] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  const { data: leavesData, isLoading, refetch } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => {
      const res = await api.get('/leaves/my');
      return res.data?.data || res.data || [];
    }
  });

  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const res = await api.get('/leaves/types');
      return res.data?.data || res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formData.leaveTypeId) throw new Error('Vui lòng chọn loại nghỉ phép');
      if (!formData.startDate || !formData.endDate) throw new Error('Vui lòng nhập ngày nghỉ');
      if (!formData.reason.trim()) throw new Error('Vui lòng nhập lý do');
      const start = new Date(formData.startDate);
      const end   = new Date(formData.endDate);
      if (end < start) throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
      return api.post('/leaves', { ...formData, totalDays: diff });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      setShowModal(false);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      if (Platform.OS === 'web') {
        window.alert('✅ Thành công: Đã gửi đơn xin nghỉ phép. Chờ HR phê duyệt nhé!');
      } else {
        Alert.alert('✅ Thành công', 'Đã gửi đơn xin nghỉ phép. Chờ HR phê duyệt nhé!');
      }
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message || e.message || 'Có lỗi xảy ra';
      if (Platform.OS === 'web') window.alert('❌ Lỗi: ' + msg);
      else Alert.alert('❌ Lỗi', msg);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leaves/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      Alert.alert('✅', 'Đã hủy đơn nghỉ phép');
    },
    onError: (e: any) => Alert.alert('❌ Lỗi', e.response?.data?.message || 'Không thể hủy')
  });

  const handleCancel = (item: any) => {
    const doCancel = () => cancelMutation.mutate(item.id);
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn hủy đơn này?')) doCancel();
    } else {
      Alert.alert('Hủy đơn', 'Xác nhận hủy đơn nghỉ phép này?', [
        { text: 'Không', style: 'cancel' },
        { text: 'Hủy đơn', style: 'destructive', onPress: doCancel }
      ]);
    }
  };

  const leaves = Array.isArray(leavesData) ? leavesData : [];
  const leaveTypes = Array.isArray(leaveTypesData) ? leaveTypesData : [];
  const filtered = filter ? leaves.filter((l: any) => l.status === filter) : leaves;

  const stats = {
    all:      leaves.length,
    pending:  leaves.filter((l: any) => l.status === 'PENDING').length,
    approved: leaves.filter((l: any) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l: any) => l.status === 'REJECTED').length,
  };

  const selectedType = leaveTypes.find((lt: any) => lt.id === formData.leaveTypeId);
  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    try {
      const diff = Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000) + 1;
      return diff > 0 ? diff : 0;
    } catch { return 0; }
  };

  const renderItem = ({ item }: { item: any }) => {
    const cfg = statusConfig[item.status] || statusConfig.PENDING;
    const Icon = cfg.icon;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.typeIcon}>
            <Calendar size={18} color="#2563eb" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.leaveTypeName}>{item.leaveType?.name || 'Nghỉ phép'}</Text>
            <Text style={styles.daysText}>{item.totalDays} ngày · {item.leaveType?.isPaid ? '✅ Có lương' : '❌ Không lương'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Icon size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateMeta}>Từ ngày</Text>
            <Text style={styles.dateVal}>{new Date(item.startDate).toLocaleDateString('vi-VN')}</Text>
          </View>
          <ChevronRight size={16} color="#cbd5e1" />
          <View style={styles.dateItem}>
            <Text style={styles.dateMeta}>Đến ngày</Text>
            <Text style={styles.dateVal}>{new Date(item.endDate).toLocaleDateString('vi-VN')}</Text>
          </View>
        </View>

        {item.reason && <Text style={styles.reasonText} numberOfLines={2}>📝 {item.reason}</Text>}
        {item.note && <Text style={styles.noteText} numberOfLines={2}>💬 Ghi chú: {item.note}</Text>}

        {item.status === 'PENDING' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)} disabled={cancelMutation.isPending}>
            <Trash2 size={14} color="#ef4444" />
            <Text style={styles.cancelText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nghỉ phép</Text>
          <Text style={styles.subtitle}>Quản lý đơn xin nghỉ của bạn</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={styles.tabsContent}>
        {[
          { key: '',         label: 'Tất cả',    val: stats.all },
          { key: 'PENDING',  label: 'Chờ duyệt', val: stats.pending },
          { key: 'APPROVED', label: 'Đã duyệt',  val: stats.approved },
          { key: 'REJECTED', label: 'Từ chối',   val: stats.rejected },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, filter === t.key && styles.tabActive]}
            onPress={() => setFilter(t.key)}
          >
            <Text style={[styles.tabNum, filter === t.key && styles.tabNumActive]}>{t.val}</Text>
            <Text style={[styles.tabLabel, filter === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}><Calendar size={32} color="#94a3b8" /></View>
          <Text style={styles.emptyTitle}>Chưa có đơn nghỉ phép</Text>
          <Text style={styles.emptyText}>Bấm nút + để gửi đơn xin nghỉ mới</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Tạo đơn mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Xin nghỉ phép</Text>
                <Text style={styles.modalSub}>Điền thông tin để gửi đơn</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Leave Type */}
              <Text style={styles.label}>Loại nghỉ phép <Text style={styles.required}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {leaveTypes.map((lt: any) => (
                  <TouchableOpacity
                    key={lt.id}
                    style={[styles.chip, formData.leaveTypeId === lt.id && styles.chipActive]}
                    onPress={() => setFormData({ ...formData, leaveTypeId: lt.id })}
                  >
                    <Text style={[styles.chipText, formData.leaveTypeId === lt.id && styles.chipTextActive]}>{lt.name}</Text>
                    {lt.isPaid && <Text style={[styles.chipBadge, formData.leaveTypeId === lt.id && { color: '#2563eb' }]}>Có lương</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Dates — dùng date picker thật */}
              <View style={styles.dateRow2}>
                <View style={{ flex: 1 }}>
                  <DatePickerField
                    label="Từ ngày"
                    value={formData.startDate}
                    onChange={t => setFormData({ ...formData, startDate: t })}
                    required
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <DatePickerField
                    label="Đến ngày"
                    value={formData.endDate}
                    onChange={t => setFormData({ ...formData, endDate: t })}
                    required
                    minDate={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </View>
              </View>

              {/* Days preview */}
              {calcDays() > 0 && (
                <View style={styles.daysPreview}>
                  <AlertCircle size={16} color="#2563eb" />
                  <Text style={styles.daysPreviewText}>
                    Tổng: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{calcDays()} ngày</Text>
                    {selectedType && ` · Tối đa ${selectedType.maxDaysPerYear} ngày/năm`}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Lý do nghỉ <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Nhập lý do xin nghỉ phép..."
                multiline
                value={formData.reason}
                onChangeText={t => setFormData({ ...formData, reason: t })}
              />

              <TouchableOpacity
                style={[styles.submitBtn, createMutation.isPending && { opacity: 0.7 }]}
                onPress={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <><Send size={18} color="#fff" /><Text style={styles.submitText}>Gửi đơn</Text></>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  tabsBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', maxHeight: 80 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, backgroundColor: '#f8fafc', minWidth: 80 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabNum: { fontSize: 18, fontWeight: 'bold', color: '#94a3b8' },
  tabNumActive: { color: '#2563eb' },
  tabLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  tabLabelActive: { color: '#2563eb', fontWeight: '600' },

  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  leaveTypeName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  daysText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 10, justifyContent: 'space-between' },
  dateItem: { alignItems: 'center' },
  dateMeta: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  dateVal: { fontSize: 14, fontWeight: '600', color: '#334155' },
  reasonText: { fontSize: 13, color: '#475569', marginBottom: 4, lineHeight: 18 },
  noteText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', lineHeight: 18 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  cancelText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  modalSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  required: { color: '#ef4444' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 15, marginBottom: 16, backgroundColor: '#f8fafc', color: '#1e293b' },
  dateRow2: { flexDirection: 'row', gap: 12 },

  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  chipText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  chipTextActive: { color: '#2563eb', fontWeight: 'bold' },
  chipBadge: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  daysPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 16 },
  daysPreviewText: { fontSize: 14, color: '#475569' },

  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
