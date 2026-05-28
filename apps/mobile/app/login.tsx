import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView
} from 'react-native';
import { useAuth } from '../src/lib/auth-context';
import api from '../src/lib/api';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Building2 } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu'); return; }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      const { token } = response.data.data;
      await auth.login(token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoBox}>
            <ShieldCheck size={36} color="#fff" />
          </View>
          <Text style={styles.brandName}>CoreHRM</Text>
          <Text style={styles.brandTagline}>Hệ thống quản lý nhân sự doanh nghiệp</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardSubtitle}>Chào mừng trở lại! Nhập thông tin để tiếp tục.</Text>

          {/* Error box */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email công ty</Text>
            <View style={[styles.inputWrap, error && email.trim() === '' && styles.inputError]}>
              <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="ten@congty.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mật khẩu</Text>
            <View style={[styles.inputWrap, error && !password && styles.inputError]}>
              <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Demo accounts */}
          <View style={styles.demoSection}>
            <View style={styles.demoDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Tài khoản thử nghiệm</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => { setEmail('nhanvien@demo.com'); setPassword('123456'); setError(''); }}
              >
                <Text style={styles.demoBtnLabel}>👤 Nhân viên Demo</Text>
                <Text style={styles.demoBtnSub}>nhanvien@demo.com</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoBtn, styles.demoBtnAdmin]}
                onPress={() => { setEmail('admin@example.com'); setPassword('123456'); setError(''); }}
              >
                <Text style={[styles.demoBtnLabel, { color: '#1d4ed8' }]}>🛡️ Admin</Text>
                <Text style={[styles.demoBtnSub, { color: '#3b82f6' }]}>admin@example.com</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact IT */}
          <View style={styles.helpBox}>
            <Building2 size={16} color="#64748b" />
            <Text style={styles.helpText}>
              Quên mật khẩu? Liên hệ bộ phận IT hoặc quản trị viên HR để được hỗ trợ cấp lại.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>CoreHRM Mobile v1.0.0 · © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1e40af' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

  // Brand
  brandSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  brandName: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  brandTagline: { fontSize: 13, color: '#93c5fd', marginTop: 6, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40,
    elevation: 12,
  },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },

  // Error
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '500' },

  // Fields
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    backgroundColor: '#f8fafc', paddingHorizontal: 14, height: 52,
  },
  inputError: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  eyeBtn: { padding: 4 },

  // Button
  loginBtn: {
    backgroundColor: '#2563eb', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  // Demo buttons
  demoSection: { marginTop: 16 },
  demoDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', gap: 4,
  },
  demoBtnAdmin: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  demoBtnLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  demoBtnSub: { fontSize: 11, color: '#94a3b8' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  // Help
  helpBox: { flexDirection: 'row', gap: 10, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  helpText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 18 },

  footer: { textAlign: 'center', color: '#93c5fd', fontSize: 12, marginTop: 24 },
});
