import { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, FlatList
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { Clock, MapPin, LogIn, LogOut, CheckCircle, AlertCircle, Timer } from 'lucide-react-native';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:    { label: 'Đúng giờ',  color: '#16a34a', bg: '#f0fdf4' },
  LATE:       { label: 'Đi muộn',   color: '#d97706', bg: '#fef3c7' },
  EARLY_LEAVE:{ label: 'Về sớm',   color: '#ea580c', bg: '#fff7ed' },
  ABSENT:     { label: 'Vắng mặt', color: '#ef4444', bg: '#fef2f2' },
};

export default function AttendanceScreen() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance/my');
      return res.data?.data || res.data || [];
    }
  });

  const records = Array.isArray(attendanceData) ? attendanceData : [];

  const todayRecord = records.find((r: any) => {
    return new Date(r.createdAt).toDateString() === new Date().toDateString();
  });

  const totalPresent = records.filter((r: any) => r.status === 'PRESENT').length;
  const totalLate    = records.filter((r: any) => r.status === 'LATE').length;
  const totalDays    = records.length;

  const checkInMutation = useMutation({
    mutationFn: () => { setLoading(true); return api.post('/attendance/check-in', { location: 'Văn phòng' }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-attendance'] }); setLoading(false); Alert.alert('✅ Thành công', 'Đã chấm công vào!'); },
    onError:   (e: any) => { setLoading(false); Alert.alert('❌ Lỗi', e.response?.data?.message || 'Đã chấm công rồi!'); }
  });
  const checkOutMutation = useMutation({
    mutationFn: () => { setLoading(true); return api.post('/attendance/check-out', { location: 'Văn phòng' }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-attendance'] }); setLoading(false); Alert.alert('✅ Thành công', 'Đã chấm công ra!'); },
    onError:   (e: any) => { setLoading(false); Alert.alert('❌ Lỗi', e.response?.data?.message || 'Lỗi chấm công!'); }
  });

  const fmt = (d: string | null) => d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const calcHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return null;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chấm công</Text>
        <Text style={styles.subtitle}>Quản lý giờ làm việc của bạn</Text>
      </View>

      {/* Today Card */}
      <View style={styles.section}>
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View style={styles.todayIconBox}><Clock size={20} color="#2563eb" /></View>
            <View>
              <Text style={styles.todayTitle}>Hôm nay</Text>
              <Text style={styles.todayDate}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</Text>
            </View>
            {todayRecord && (
              <View style={[styles.statusPill, { backgroundColor: statusConfig[todayRecord.status]?.bg || '#f8fafc' }]}>
                <Text style={[styles.statusPillText, { color: statusConfig[todayRecord.status]?.color || '#64748b' }]}>
                  {statusConfig[todayRecord.status]?.label || todayRecord.status}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <View style={styles.timeIconRow}>
                <LogIn size={16} color="#16a34a" />
                <Text style={styles.timeLabel}>Giờ vào</Text>
              </View>
              <Text style={[styles.timeValue, { color: '#16a34a' }]}>{fmt(todayRecord?.createdAt)}</Text>
              {todayRecord?.locationIn && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color="#94a3b8" />
                  <Text style={styles.locationText}>{todayRecord.locationIn}</Text>
                </View>
              )}
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeBlock}>
              <View style={styles.timeIconRow}>
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.timeLabel}>Giờ ra</Text>
              </View>
              <Text style={[styles.timeValue, { color: todayRecord?.checkOut ? '#ef4444' : '#94a3b8' }]}>
                {fmt(todayRecord?.checkOut)}
              </Text>
              {todayRecord?.checkOut && (
                <View style={styles.locationRow}>
                  <Timer size={12} color="#94a3b8" />
                  <Text style={styles.locationText}>{calcHours(todayRecord.createdAt, todayRecord.checkOut)}</Text>
                </View>
              )}
            </View>
          </View>

          {!todayRecord ? (
            <TouchableOpacity style={styles.checkInBtn} onPress={() => checkInMutation.mutate()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <LogIn size={20} color="#fff" />
                  <Text style={styles.checkBtnText}>Bắt đầu làm việc</Text>
                </>
              )}
            </TouchableOpacity>
          ) : !todayRecord.checkOut ? (
            <TouchableOpacity style={styles.checkOutBtn} onPress={() => checkOutMutation.mutate()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <LogOut size={20} color="#fff" />
                  <Text style={styles.checkBtnText}>Kết thúc làm việc</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.doneBox}>
              <CheckCircle size={20} color="#16a34a" />
              <Text style={styles.doneText}>Hoàn thành hôm nay · {calcHours(todayRecord.createdAt, todayRecord.checkOut)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.statVal, { color: '#16a34a' }]}>{totalPresent}</Text>
          <Text style={styles.statLbl}>Đúng giờ</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statVal, { color: '#d97706' }]}>{totalLate}</Text>
          <Text style={styles.statLbl}>Đi muộn</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.statVal, { color: '#2563eb' }]}>{totalDays}</Text>
          <Text style={styles.statLbl}>Tổng ngày</Text>
        </View>
      </View>

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử chấm công</Text>
        {isLoading ? <ActivityIndicator color="#2563eb" style={{ margin: 20 }} /> : (
          records.slice(0, 20).map((r: any) => {
            const cfg = statusConfig[r.status] || { label: r.status, color: '#64748b', bg: '#f8fafc' };
            return (
              <View key={r.id} style={styles.historyCard}>
                <View style={[styles.historyDot, { backgroundColor: cfg.color }]} />
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </Text>
                    <View style={[styles.historyBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.historyBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <View style={styles.historyTimes}>
                    <View style={styles.historyTimeItem}>
                      <LogIn size={14} color="#16a34a" />
                      <Text style={styles.historyTimeText}>{fmt(r.createdAt)}</Text>
                    </View>
                    <Text style={styles.historyArrow}>→</Text>
                    <View style={styles.historyTimeItem}>
                      <LogOut size={14} color="#ef4444" />
                      <Text style={styles.historyTimeText}>{fmt(r.checkOut)}</Text>
                    </View>
                    {r.checkOut && (
                      <View style={styles.historyTimeItem}>
                        <Timer size={14} color="#64748b" />
                        <Text style={[styles.historyTimeText, { color: '#2563eb', fontWeight: '600' }]}>{calcHours(r.createdAt, r.checkOut)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
        {records.length === 0 && !isLoading && (
          <View style={styles.emptyBox}>
            <Clock size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Chưa có lịch sử chấm công</Text>
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  section: { padding: 16 },
  todayCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  todayIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  todayTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  todayDate: { fontSize: 13, color: '#64748b' },
  statusPill: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  timeRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingVertical: 16, marginBottom: 16 },
  timeBlock: { flex: 1, alignItems: 'center', gap: 6 },
  timeDivider: { width: 1, backgroundColor: '#f1f5f9' },
  timeIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeLabel: { fontSize: 12, color: '#64748b' },
  timeValue: { fontSize: 24, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11, color: '#94a3b8' },
  checkInBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkOutBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  doneBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: '#f0fdf4', borderRadius: 16 },
  doneText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 4 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: 'bold' },
  statLbl: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  historyCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  historyContent: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#334155' },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  historyBadgeText: { fontSize: 11, fontWeight: '600' },
  historyTimes: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  historyTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyTimeText: { fontSize: 13, color: '#475569' },
  historyArrow: { color: '#cbd5e1', fontSize: 14 },
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
