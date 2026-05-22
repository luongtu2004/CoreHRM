import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { Bell, Clock, Calendar, DollarSign, ShieldCheck, LogIn, LogOut, ChevronRight, User } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ['my-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data?.data || {}
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data?.data?.count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: myAttendance } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance/my');
      return res.data?.data || res.data || [];
    }
  });

  const { data: myLeaves } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => {
      const res = await api.get('/leaves/my');
      return res.data?.data || res.data || [];
    }
  });

  const records = Array.isArray(myAttendance) ? myAttendance : [];
  const leaves  = Array.isArray(myLeaves) ? myLeaves : [];
  const todayRecord = records.find((r: any) => new Date(r.createdAt).toDateString() === new Date().toDateString());
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;

  const fmt = (d: string | null) => d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const checkIn = useMutation({
    mutationFn: () => api.post('/attendance/check-in', { location: 'Văn phòng' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-attendance'] }); Alert.alert('✅ Thành công', 'Đã chấm công vào!'); },
    onError: (e: any) => Alert.alert('❌ Lỗi', e.response?.data?.message || 'Đã chấm công hôm nay rồi!')
  });
  const checkOut = useMutation({
    mutationFn: () => api.post('/attendance/check-out', { location: 'Văn phòng' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-attendance'] }); Alert.alert('✅ Thành công', 'Đã chấm công ra!'); },
    onError: (e: any) => Alert.alert('❌ Lỗi', e.response?.data?.message || 'Chưa chấm công vào!')
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Gradient Header */}
      <View style={styles.gradientHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>Xin chào 👋</Text>
            <Text style={styles.nameText}>CoreHRM Employee</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')}>
            <Bell size={22} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.todayStrip}>
          <View style={styles.todayStripItem}>
            <Text style={styles.stripLabel}>Giờ vào</Text>
            <Text style={styles.stripValue}>{fmt(todayRecord?.createdAt)}</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.todayStripItem}>
            <Text style={styles.stripLabel}>Giờ ra</Text>
            <Text style={styles.stripValue}>{fmt(todayRecord?.checkOut)}</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.todayStripItem}>
            <Text style={styles.stripLabel}>Trạng thái</Text>
            <Text style={styles.stripValue}>{todayRecord ? (todayRecord.checkOut ? '✅ Xong' : '🟢 Đang làm') : '⬜ Chưa vào'}</Text>
          </View>
        </View>
      </View>

      {/* Check-in/out */}
      <View style={styles.checkRow}>
        {!todayRecord ? (
          <TouchableOpacity style={styles.checkInBtn} onPress={() => checkIn.mutate()} disabled={checkIn.isPending}>
            {checkIn.isPending ? <ActivityIndicator color="#fff" /> : (
              <><LogIn size={20} color="#fff" /><Text style={styles.checkBtnText}>Bắt đầu làm việc</Text></>
            )}
          </TouchableOpacity>
        ) : !todayRecord.checkOut ? (
          <TouchableOpacity style={styles.checkOutBtn} onPress={() => checkOut.mutate()} disabled={checkOut.isPending}>
            {checkOut.isPending ? <ActivityIndicator color="#fff" /> : (
              <><LogOut size={20} color="#fff" /><Text style={styles.checkBtnText}>Kết thúc làm việc</Text></>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.doneBadge}>
            <Text style={styles.doneText}>✅ Đã hoàn thành chấm công hôm nay</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { icon: Clock,      bg: '#eff6ff', iconBg: '#2563eb', val: records.length,              label: 'Ngày công',    route: '/(tabs)/attendance' },
          { icon: Calendar,   bg: '#fef3c7', iconBg: '#d97706', val: pendingLeaves,               label: 'Chờ duyệt NP', route: '/(tabs)/leaves' },
          { icon: DollarSign, bg: '#f0fdf4', iconBg: '#16a34a', val: summary?.totalEmployees || 0, label: 'Nhân viên CT', route: '/(tabs)/payslips' },
          { icon: User,       bg: '#fdf4ff', iconBg: '#7c3aed', val: '—',                         label: 'Hồ sơ',       route: '/(tabs)/profile' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={[styles.statCard, { backgroundColor: item.bg }]} onPress={() => router.push(item.route as any)}>
            <View style={[styles.statIcon, { backgroundColor: item.iconBg }]}>
              <item.icon size={20} color="#fff" />
            </View>
            <Text style={styles.statNum}>{item.val}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
        {[
          { icon: Clock,      iconBg: '#eff6ff', iconColor: '#2563eb', title: 'Lịch sử chấm công', sub: 'Xem toàn bộ lịch sử vào/ra',    route: '/(tabs)/attendance' },
          { icon: Calendar,   iconBg: '#fef3c7', iconColor: '#d97706', title: 'Đơn xin nghỉ phép', sub: 'Gửi và theo dõi đơn nghỉ phép', route: '/(tabs)/leaves' },
          { icon: DollarSign, iconBg: '#f0fdf4', iconColor: '#16a34a', title: 'Phiếu lương',       sub: 'Xem chi tiết lương hàng tháng',  route: '/(tabs)/payslips' },
          { icon: Bell,       iconBg: '#fdf4ff', iconColor: '#7c3aed', title: 'Thông báo',         sub: 'Tin tức và cập nhật từ HR',       route: '/notifications' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
            <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
              <item.icon size={22} color={item.iconColor} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.brandFooter}>
        <ShieldCheck size={20} color="#2563eb" />
        <Text style={styles.brandText}>CoreHRM · Hệ thống quản lý nhân sự</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  gradientHeader: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greetingText: { color: '#bfdbfe', fontSize: 14 },
  nameText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2563eb' },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  todayStrip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-around' },
  todayStripItem: { alignItems: 'center', flex: 1 },
  stripLabel: { color: '#bfdbfe', fontSize: 12, marginBottom: 4 },
  stripValue: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  stripDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  checkRow: { paddingHorizontal: 16, paddingVertical: 12 },
  checkInBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkOutBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  doneBadge: { backgroundColor: '#f0fdf4', padding: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  doneText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { flex: 1, minWidth: '40%', padding: 16, borderRadius: 16, alignItems: 'center', gap: 8 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  menuIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  menuSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  brandFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, opacity: 0.5 },
  brandText: { fontSize: 13, color: '#64748b' },
});
