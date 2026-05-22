import { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { LifeBuoy, Clock, CheckCircle, AlertTriangle, MessageSquare, Plus, X } from 'lucide-react-native';
import { useAuth } from '../../src/lib/auth-context';

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Thấp',    color: '#16a34a', bg: '#f0fdf4' },
  MEDIUM: { label: 'Bình thường', color: '#d97706', bg: '#fef3c7' },
  HIGH:   { label: 'Cao',    color: '#ea580c', bg: '#fff7ed' },
  URGENT: { label: 'Khẩn cấp', color: '#ef4444', bg: '#fef2f2' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN:        { label: 'Đang mở',   color: '#64748b', icon: MessageSquare },
  IN_PROGRESS: { label: 'Đang xử lý',  color: '#2563eb', icon: Clock },
  RESOLVED:    { label: 'Đã giải quyết', color: '#16a34a', icon: CheckCircle },
  CLOSED:      { label: 'Đã đóng', color: '#94a3b8', icon: CheckCircle },
};

export default function TicketsScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'MEDIUM', targetDept: 'IT' });

  const { data: userData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data?.data || res.data;
    }
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data?.data?.data || res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      Alert.alert('✅ Thành công', 'Đã gửi phiếu hỗ trợ!');
      setShowCreate(false);
      setForm({ title: '', content: '', priority: 'MEDIUM', targetDept: 'IT' });
    },
    onError: (e: any) => Alert.alert('❌ Lỗi', e.response?.data?.message || 'Có lỗi xảy ra')
  });

  const tickets = Array.isArray(ticketsData) ? ticketsData : [];
  
  // Lọc ra các ticket do mình tạo HOẶC được giao cho mình
  const myTickets = tickets.filter((t: any) => t.createdBy === userData?.id || t.assignedTo === userData?.id);
  const filtered = filter ? myTickets.filter((t: any) => t.status === filter) : myTickets;

  const handleSubmit = () => {
    if (!form.title || !form.content) return Alert.alert('Lỗi', 'Vui lòng điền đủ tiêu đề và nội dung');
    
    const { targetDept, ...restForm } = form;
    const finalData = {
      ...restForm,
      title: `[${targetDept}] ${form.title}`
    };
    
    createMutation.mutate(finalData);
  };

  const renderItem = ({ item }: { item: any }) => {
    const pri = priorityConfig[item.priority] || priorityConfig.MEDIUM;
    const st  = statusConfig[item.status]    || statusConfig.OPEN;
    const StIcon = st.icon;
    const isResolved = item.status === 'RESOLVED' || item.status === 'CLOSED';
    
    return (
      <View style={[styles.card, isResolved && styles.cardDone]}>
        <View style={styles.cardHeader}>
          <View style={[styles.priorityTag, { backgroundColor: pri.bg }]}>
            <AlertTriangle size={12} color={pri.color} />
            <Text style={[styles.priorityText, { color: pri.color }]}>{pri.label}</Text>
          </View>
          <View style={styles.statusTag}>
            <StIcon size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <Text style={[styles.taskTitle, isResolved && styles.taskTitleDone]}>{item.title}</Text>
        <Text style={styles.taskDesc} numberOfLines={2}>{item.content}</Text>

        {item.note && (
          <View style={{ backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#3b82f6' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6', marginBottom: 4 }}>Phản hồi từ Admin:</Text>
            <Text style={{ fontSize: 13, color: '#334155' }}>{item.note}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            Tạo ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
          {item.assignedUser && (
            <Text style={styles.footerText}> • Hỗ trợ bởi: {item.assignedUser.name}</Text>
          )}
        </View>
      </View>
    );
  };

  if (showCreate) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <X size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Gửi yêu cầu hỗ trợ</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View>
            <Text style={styles.label}>Gửi đến phòng ban</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['IT', 'HR', 'Admin'].map(dept => (
                <TouchableOpacity 
                  key={dept} 
                  style={[styles.priBtn, form.targetDept === dept && { backgroundColor: '#2563eb', borderColor: '#2563eb' }]}
                  onPress={() => setForm({ ...form, targetDept: dept })}
                >
                  <Text style={[styles.priBtnText, form.targetDept === dept && { color: '#fff' }]}>{dept}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Quên mật khẩu email, Lỗi wifi..."
              value={form.title}
              onChangeText={t => setForm({ ...form, title: t })}
            />
          </View>
          <View>
            <Text style={styles.label}>Mức độ ưu tiên</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  style={[styles.priBtn, form.priority === p && { backgroundColor: priorityConfig[p].color, borderColor: priorityConfig[p].color }]}
                  onPress={() => setForm({ ...form, priority: p })}
                >
                  <Text style={[styles.priBtnText, form.priority === p && { color: '#fff' }]}>{priorityConfig[p].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.label}>Nội dung chi tiết</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
              value={form.content}
              onChangeText={t => setForm({ ...form, content: t })}
              multiline
            />
          </View>
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={styles.title}>Phiếu hỗ trợ</Text>
          <Text style={styles.subtitle}>Gửi yêu cầu cho IT / HR</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statItem, filter === '' && styles.statActive]} onPress={() => setFilter('')}>
          <Text style={[styles.statLbl, filter === '' && styles.statNumActive]}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statItem, filter === 'OPEN' && styles.statActive]} onPress={() => setFilter('OPEN')}>
          <Text style={[styles.statLbl, filter === 'OPEN' && styles.statNumActive]}>Đang mở</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statItem, filter === 'IN_PROGRESS' && styles.statActive]} onPress={() => setFilter('IN_PROGRESS')}>
          <Text style={[styles.statLbl, filter === 'IN_PROGRESS' && styles.statNumActive]}>Đang xử lý</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statItem, filter === 'RESOLVED' && styles.statActive]} onPress={() => setFilter('RESOLVED')}>
          <Text style={[styles.statLbl, filter === 'RESOLVED' && styles.statNumActive]}>Đã xong</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <LifeBuoy size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Chưa có phiếu hỗ trợ nào</Text>
          <Text style={styles.emptyText}>Bấm dấu + góc phải trên để tạo phiếu hỗ trợ mới</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  createBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, marginHorizontal: 4 },
  statActive: { backgroundColor: '#eff6ff' },
  statNumActive: { color: '#2563eb', fontWeight: 'bold' },
  statLbl: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  cardDone: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priorityTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  taskTitleDone: { color: '#94a3b8' },
  taskDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 10 },
  footerText: { fontSize: 12, color: '#94a3b8' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 15, color: '#1e293b' },
  priBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  priBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
