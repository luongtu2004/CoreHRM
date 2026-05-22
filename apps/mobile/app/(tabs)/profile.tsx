import { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Platform, KeyboardAvoidingView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import {
  User, Mail, Phone, Briefcase, Building2, Shield,
  LogOut, ChevronRight, Key, Calendar, Award, DollarSign, Hash
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data: user, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data?.data || res.data;
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (pwForm.newPassword !== pwForm.confirmPassword) throw new Error('Mật khẩu mới không khớp!');
      if (pwForm.newPassword.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return api.patch('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
    },
    onSuccess: () => {
      Alert.alert('✅ Thành công', 'Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => Alert.alert('❌ Lỗi', e.message || e.response?.data?.message || 'Có lỗi xảy ra')
  });

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // web: dùng confirm() của browser
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await auth.logout();
        queryClient.clear();
        window.location.href = '/login';
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: async () => {
          await auth.logout();
          queryClient.clear();
        }}
      ]);
    }
  };

  const fmt = (val: any) => val || 'Chưa cập nhật';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const fmtSalary = (s: number) => s ? s.toLocaleString('vi-VN') + ' ₫' : 'Chưa cập nhật';

  const roleLabel = user?.userRoles?.[0]?.role?.name || 'Nhân viên';
  const emp = user?.employee;

  if (isLoading) return (
    <View style={styles.loadingBox}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
        <Text style={styles.userRole}>{emp?.position || roleLabel}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: user?.status === 'ACTIVE' ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>{user?.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}</Text>
        </View>
      </View>

      {/* Employee Code & Dept */}
      {emp && (
        <View style={styles.empBanner}>
          <View style={styles.empBannerItem}>
            <Hash size={16} color="#60a5fa" />
            <Text style={styles.empBannerLabel}>Mã nhân viên</Text>
            <Text style={styles.empBannerValue}>{emp.employeeCode || '—'}</Text>
          </View>
          <View style={styles.empBannerDivider} />
          <View style={styles.empBannerItem}>
            <Building2 size={16} color="#60a5fa" />
            <Text style={styles.empBannerLabel}>Phòng ban</Text>
            <Text style={styles.empBannerValue}>{emp.department?.name || '—'}</Text>
          </View>
          <View style={styles.empBannerDivider} />
          <View style={styles.empBannerItem}>
            <Calendar size={16} color="#60a5fa" />
            <Text style={styles.empBannerLabel}>Ngày vào</Text>
            <Text style={styles.empBannerValue}>{fmtDate(emp.startDate)}</Text>
          </View>
        </View>
      )}

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={styles.card}>
          {[
            { icon: Mail,      label: 'Email',       val: fmt(user?.email) },
            { icon: Phone,     label: 'Điện thoại',  val: fmt(user?.phone) },
            { icon: Briefcase, label: 'Chức vụ',     val: fmt(emp?.position) },
            { icon: Shield,    label: 'Vai trò',      val: roleLabel },
          ].map((row, i, arr) => (
            <View key={i}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><row.icon size={18} color="#64748b" /></View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.val}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Salary (if available) */}
      {emp?.salary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin lương</Text>
          <View style={[styles.card, styles.salaryCard]}>
            <View style={styles.salaryIcon}><DollarSign size={24} color="#2563eb" /></View>
            <View>
              <Text style={styles.salaryLabel}>Lương cơ bản</Text>
              <Text style={styles.salaryValue}>{fmtSalary(emp.salary)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPasswordModal(true)}>
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}><Key size={18} color="#2563eb" /></View>
            <Text style={styles.actionText}>Đổi mật khẩu</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* App version */}
      <Text style={styles.version}>CoreHRM Mobile v1.0.0</Text>
      <View style={{ height: 40 }} />

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu hiện tại"
              secureTextEntry
              value={pwForm.currentPassword}
              onChangeText={t => setPwForm({ ...pwForm, currentPassword: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
              secureTextEntry
              value={pwForm.newPassword}
              onChangeText={t => setPwForm({ ...pwForm, newPassword: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu mới"
              secureTextEntry
              value={pwForm.confirmPassword}
              onChangeText={t => setPwForm({ ...pwForm, confirmPassword: t })}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => changePasswordMutation.mutate()}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmText}>Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },

  // Header
  header: { backgroundColor: '#2563eb', alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 34, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userRole: { fontSize: 15, color: '#bfdbfe', marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '500' },

  // Employee banner
  empBanner: { backgroundColor: '#1d4ed8', flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  empBannerItem: { flex: 1, alignItems: 'center', gap: 4 },
  empBannerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  empBannerLabel: { color: '#93c5fd', fontSize: 11 },
  empBannerValue: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Sections
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#f8fafc', marginVertical: 8 },

  // Salary
  salaryCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  salaryIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  salaryLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  salaryValue: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },

  // Actions
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, backgroundColor: '#fef2f2', borderRadius: 16, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },

  version: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#f8fafc', color: '#1e293b' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#64748b', fontSize: 15 },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center' },
  confirmText: { fontWeight: '600', color: '#fff', fontSize: 15 },
});
