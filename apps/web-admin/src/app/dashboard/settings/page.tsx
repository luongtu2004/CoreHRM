'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  User, Lock, Bell, Globe, Palette, Shield, Save,
  Eye, EyeOff, Check, Monitor, Sun, Moon, CheckCircle2,
  AlertCircle, Info, Loader2, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/hooks/useLanguage';
import { useDensity } from '@/hooks/useDensity';

const tabs = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'security', label: 'Bảo mật', icon: Lock },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'appearance', label: 'Giao diện', icon: Palette },
  { id: 'system', label: 'Hệ thống', icon: Globe },
];

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15';
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-500' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-slate-100">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}

const NOTIF_KEY = 'coreHRM_notifPrefs';

export default function SettingsPage() {
  const { user, fetchMe } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { density, setDensity } = useDensity();
  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Profile ──
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data?.data || res.data;
    },
  });

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', position: '',
  });

  useEffect(() => {
    if (meData) {
      setProfile({
        name: meData.name || '',
        email: meData.email || '',
        phone: meData.phone || '',
        position: meData.employee?.position || '',
      });
    }
  }, [meData]);

  const profileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me/profile', data),
    onSuccess: async () => {
      toast.success('Đã lưu thông tin hồ sơ!');
      await fetchMe();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể cập nhật hồ sơ'),
  });

  // ── Password ──
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me/password', data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      setPasswords({ current: '', new: '', confirm: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại'),
  });

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new) {
      toast.error('Vui lòng nhập đầy đủ thông tin!'); return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Mật khẩu xác nhận không khớp!'); return;
    }
    if (passwords.new.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!'); return;
    }
    passwordMutation.mutate({ currentPassword: passwords.current, newPassword: passwords.new });
  };

  // ── Notifications ──
  const defaultNotifs = {
    emailAlerts: true, taskAssigned: true, ticketUpdates: true,
    systemAlerts: false, weeklyReport: true,
  };
  const [notifs, setNotifs] = useState(defaultNotifs);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIF_KEY);
      if (saved) setNotifs(JSON.parse(saved));
    } catch {}
  }, []);

  const saveNotifs = () => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    setNotifSaved(true);
    toast.success('Đã lưu tuỳ chọn thông báo!');
    setTimeout(() => setNotifSaved(false), 2000);
  };

  // ── Appearance ──

  const initials = profile.name
    .split(' ').map((n: string) => n[0]).filter(Boolean).slice(-2).join('').toUpperCase() || 'U';

  const pwdStrength = (pwd: string) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: 'Yếu', color: 'bg-red-400', w: 'w-1/3' };
    if (pwd.length < 10) return { label: 'Trung bình', color: 'bg-amber-400', w: 'w-2/3' };
    return { label: 'Mạnh', color: 'bg-emerald-400', w: 'w-full' };
  };
  const strength = pwdStrength(passwords.new);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý thông tin tài khoản và tuỳ chỉnh ứng dụng.</p>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-left transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div>
                <SectionHeader title="Hồ sơ cá nhân" desc="Cập nhật thông tin cá nhân của bạn." />

                {meLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    {/* Avatar card */}
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md shadow-blue-500/20">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{profile.name || 'Chưa cập nhật'}</p>
                        <p className="text-sm text-slate-500">{profile.email}</p>
                        {profile.position && (
                          <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 font-medium border border-blue-100">
                            {profile.position}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelCls}>Họ và tên</label>
                        <input className={inputCls} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Nhập họ và tên..." />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input className={`${inputCls} opacity-60 cursor-not-allowed`} type="email" value={profile.email} readOnly title="Email không thể thay đổi" />
                        <p className="text-xs text-slate-400 mt-1">Email đăng nhập không thể thay đổi</p>
                      </div>
                      <div>
                        <label className={labelCls}>Số điện thoại</label>
                        <input className={inputCls} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="VD: 0987 654 321" />
                      </div>
                      <div>
                        <label className={labelCls}>Chức vụ <span className="text-slate-400 font-normal">(chỉ đọc)</span></label>
                        <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={profile.position || 'Chưa có chức vụ'} readOnly />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <Button
                        onClick={() => profileMutation.mutate({ name: profile.name, phone: profile.phone })}
                        disabled={profileMutation.isPending}
                        className="rounded-xl px-5 flex items-center gap-2"
                      >
                        {profileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Lưu thay đổi
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div>
                <SectionHeader title="Bảo mật tài khoản" desc="Đổi mật khẩu để giữ tài khoản an toàn." />

                <div className="space-y-4 mb-6 max-w-md">
                  {(['current', 'new', 'confirm'] as const).map((field) => {
                    const labels = { current: 'Mật khẩu hiện tại', new: 'Mật khẩu mới', confirm: 'Xác nhận mật khẩu mới' };
                    return (
                      <div key={field}>
                        <label className={labelCls}>{labels[field]}</label>
                        <div className="relative">
                          <input
                            className={inputCls + ' pr-10'}
                            type={showPwd[field] ? 'text' : 'password'}
                            value={passwords[field]}
                            onChange={e => setPasswords({ ...passwords, [field]: e.target.value })}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd({ ...showPwd, [field]: !showPwd[field] })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPwd[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* Password strength bar */}
                        {field === 'new' && passwords.new && strength && (
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Độ mạnh: <span className="font-medium">{strength.label}</span></p>
                          </div>
                        )}
                        {/* Confirm match indicator */}
                        {field === 'confirm' && passwords.confirm && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${passwords.new === passwords.confirm ? 'text-emerald-600' : 'text-red-500'}`}>
                            {passwords.new === passwords.confirm
                              ? <><CheckCircle2 className="h-3 w-3" /> Mật khẩu khớp</>
                              : <><AlertCircle className="h-3 w-3" /> Mật khẩu không khớp</>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 mb-6 max-w-md">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-semibold mb-0.5">Lưu ý bảo mật</p>
                      <p>Mật khẩu mới phải có ít nhất <strong>6 ký tự</strong>. Không chia sẻ mật khẩu với người khác.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={passwordMutation.isPending}
                  className="rounded-xl px-5 flex items-center gap-2"
                >
                  {passwordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Đổi mật khẩu
                </Button>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <div>
                <SectionHeader title="Tuỳ chọn thông báo" desc="Chọn loại thông báo bạn muốn nhận. Lưu trên thiết bị này." />

                <div className="space-y-0 divide-y divide-slate-100">
                  {[
                    { key: 'emailAlerts', label: 'Thông báo qua Email', desc: 'Nhận cảnh báo hệ thống qua email.', icon: Bell },
                    { key: 'taskAssigned', label: 'Được giao công việc', desc: 'Nhận thông báo khi có task mới được giao.', icon: CheckCircle2 },
                    { key: 'ticketUpdates', label: 'Cập nhật Ticket', desc: 'Thông báo khi ticket bạn theo dõi có thay đổi.', icon: RefreshCw },
                    { key: 'systemAlerts', label: 'Cảnh báo hệ thống', desc: 'Thông báo lỗi, bảo trì hoặc cập nhật phiên bản.', icon: AlertCircle },
                    { key: 'weeklyReport', label: 'Báo cáo tuần', desc: 'Tóm tắt hoạt động hàng tuần gửi vào thứ Hai.', icon: Info },
                  ].map(({ key, label, desc, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notifs[key as keyof typeof notifs] ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={notifs[key as keyof typeof notifs]}
                        onChange={() => setNotifs({ ...notifs, [key]: !notifs[key as keyof typeof notifs] })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <Button onClick={saveNotifs} className="rounded-xl px-5 flex items-center gap-2">
                    {notifSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {notifSaved ? 'Đã lưu!' : 'Lưu tuỳ chọn'}
                  </Button>
                </div>
              </div>
            )}

            {/* ── APPEARANCE TAB ── */}
            {activeTab === 'appearance' && (
              <div>
                <SectionHeader title="Giao diện" desc="Tuỳ chỉnh màu sắc và cách hiển thị ứng dụng." />

                {/* Theme selector */}
                <div className="mb-6">
                  <label className={labelCls}>Chủ đề màu sắc</label>
                  <div className="grid grid-cols-3 gap-3 mt-2 max-w-sm">
                    {([
                      { id: 'light', label: 'Sáng', icon: Sun },
                      { id: 'dark', label: 'Tối', icon: Moon },
                      { id: 'system', label: 'Hệ thống', icon: Monitor },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                          mounted && theme === id
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                        {mounted && theme === id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="mb-6">
                  <label className={labelCls}>{t('settings.language')}</label>
                  <select
                    className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                    value={language}
                    onChange={e => {
                      setLanguage(e.target.value as 'vi' | 'en');
                      toast.success(e.target.value === 'en' ? 'Language changed to English!' : 'Đã chuyển sang Tiếng Việt!');
                    }}
                  >
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">Thay đổi ngay lập tức — sidebar sẽ cập nhật liền.</p>
                </div>

                {/* Density */}
                <div className="mb-6">
                  <label className={labelCls}>Mật độ giao diện</label>
                  <div className="flex gap-3 mt-2">
                    {(['comfortable', 'compact'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDensity(d)}
                        className={`rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all ${
                          density === d
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {d === 'comfortable' ? '🪑 Thoải mái' : '🗜️ Thu gọn'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button onClick={() => toast.success('Đã lưu tuỳ chọn giao diện!')} className="rounded-xl px-5 flex items-center gap-2">
                    <Save className="h-4 w-4" />Lưu giao diện
                  </Button>
                </div>
              </div>
            )}

            {/* ── SYSTEM TAB ── */}
            {activeTab === 'system' && (
              <div>
                <SectionHeader title="Thông tin hệ thống" desc="Chi tiết về ứng dụng và môi trường đang chạy." />

                <div className="space-y-1 mb-6">
                  {[
                    { label: 'Phiên bản ứng dụng', value: '1.0.0-MVP', badge: 'bg-slate-100 text-slate-600' },
                    { label: 'Môi trường', value: 'Development', badge: 'bg-amber-100 text-amber-700' },
                    { label: 'Trạng thái Database', value: '✓ Đã kết nối', badge: 'bg-emerald-100 text-emerald-700' },
                    { label: 'API Server', value: 'localhost:4000', badge: 'bg-blue-100 text-blue-700' },
                    { label: 'Admin Dashboard', value: 'localhost:3000', badge: 'bg-blue-100 text-blue-700' },
                    { label: 'Backend', value: 'Node.js + Express + Prisma', badge: 'bg-slate-100 text-slate-600' },
                    { label: 'Database', value: 'PostgreSQL (Docker)', badge: 'bg-slate-100 text-slate-600' },
                    { label: 'Frontend', value: 'Next.js 16 + Tailwind CSS', badge: 'bg-slate-100 text-slate-600' },
                  ].map(({ label, value, badge }) => (
                    <div key={label} className="flex items-center justify-between py-3.5 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">Tài khoản đang đăng nhập</p>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{user?.name || meData?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email || meData?.email}</p>
                </div>

                <p className="text-xs text-slate-400 text-center mt-6">
                  CoreHRM · Internal Company App · Xây dựng với ❤️ · {new Date().getFullYear()}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
