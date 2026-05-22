'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  User,
  Lock,
  Bell,
  Globe,
  Palette,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  Monitor,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
    <div className="mb-6">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
    position: user?.position || '',
  });

  // Security state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  // Notifications
  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    taskAssigned: true,
    ticketUpdates: true,
    systemAlerts: false,
    weeklyReport: true,
  });

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState('vi');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const handleSaveProfile = async () => {
    try {
      await api.patch('/users/me/profile', { name: profile.name, phone: profile.phone });
      toast.success('Đã lưu thông tin hồ sơ!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật hồ sơ');
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    try {
      await api.patch('/users/me/password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Đã đổi mật khẩu thành công!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  const initials = profile.name
    .split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý thông tin tài khoản và tuỳ chỉnh ứng dụng.</p>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar tabs */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-left transition-all duration-150 ${activeTab === tab.id
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
                <SectionHeader title="Hồ sơ cá nhân" desc="Cập nhật thông tin cá nhân và ảnh đại diện." />

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md shadow-blue-500/20">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{profile.name}</p>
                    <p className="text-sm text-slate-500">{profile.email}</p>
                    <p className="text-xs text-blue-500 mt-1 font-medium">{profile.position}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>Họ và tên</label>
                    <input className={inputCls} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Nhập họ và tên..." />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Số điện thoại</label>
                    <input className={inputCls} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="VD: 0987 654 321" />
                  </div>
                  <div>
                    <label className={labelCls}>Chức vụ</label>
                    <input className={inputCls} value={profile.position} onChange={e => setProfile({ ...profile, position: e.target.value })} placeholder="VD: Quản trị viên..." />
                  </div>
                </div>
                <div className="mb-6">
                  <label className={labelCls}>Giới thiệu bản thân</label>
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-none`}
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Viết vài dòng giới thiệu..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} className="rounded-xl px-5 flex items-center gap-2">
                    <Save className="h-4 w-4" />Lưu thay đổi
                  </Button>
                </div>
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
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-semibold mb-0.5">Lưu ý bảo mật</p>
                      <p>Mật khẩu mới phải có ít nhất <strong>6 ký tự</strong>. Không chia sẻ mật khẩu với người khác.</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleChangePassword} className="rounded-xl px-5 flex items-center gap-2">
                  <Lock className="h-4 w-4" />Đổi mật khẩu
                </Button>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <div>
                <SectionHeader title="Tuỳ chọn thông báo" desc="Chọn loại thông báo bạn muốn nhận." />

                <div className="space-y-0 divide-y divide-slate-100">
                  {[
                    { key: 'emailAlerts', label: 'Thông báo qua Email', desc: 'Nhận cảnh báo hệ thống qua email.' },
                    { key: 'taskAssigned', label: 'Được giao công việc', desc: 'Nhận thông báo khi có task mới được giao.' },
                    { key: 'ticketUpdates', label: 'Cập nhật Ticket', desc: 'Thông báo khi ticket bạn theo dõi có thay đổi.' },
                    { key: 'systemAlerts', label: 'Cảnh báo hệ thống', desc: 'Thông báo lỗi, bảo trì hoặc cập nhật phiên bản.' },
                    { key: 'weeklyReport', label: 'Báo cáo tuần', desc: 'Tóm tắt hoạt động hàng tuần gửi vào thứ Hai.' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <Toggle
                        checked={notifs[key as keyof typeof notifs]}
                        onChange={() => setNotifs({ ...notifs, [key]: !notifs[key as keyof typeof notifs] })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => toast.success('Đã lưu tuỳ chọn thông báo!')} className="rounded-xl px-5 flex items-center gap-2">
                    <Save className="h-4 w-4" />Lưu tuỳ chọn
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
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {([
                      { id: 'light', label: 'Sáng', icon: Sun },
                      { id: 'dark', label: 'Tối', icon: Moon },
                      { id: 'system', label: 'Hệ thống', icon: Monitor },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${theme === id
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                        {theme === id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="mb-6">
                  <label className={labelCls}>Ngôn ngữ hiển thị</label>
                  <select
                    className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                </div>

                {/* Density */}
                <div className="mb-6">
                  <label className={labelCls}>Mật độ giao diện</label>
                  <div className="flex gap-3 mt-2">
                    {(['comfortable', 'compact'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDensity(d)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all max-w-[160px] ${density === d
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {d === 'comfortable' ? '🪑 Thoải mái' : '🗜️ Thu gọn'}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={() => toast.success('Đã lưu tuỳ chọn giao diện!')} className="rounded-xl px-5 flex items-center gap-2">
                  <Save className="h-4 w-4" />Lưu giao diện
                </Button>
              </div>
            )}

            {/* ── SYSTEM TAB ── */}
            {activeTab === 'system' && (
              <div>
                <SectionHeader title="Thông tin hệ thống" desc="Chi tiết về ứng dụng và môi trường đang chạy." />

                <div className="space-y-3">
                  {[
                    { label: 'Phiên bản ứng dụng', value: '1.0.0-MVP', color: 'text-slate-800' },
                    { label: 'Môi trường', value: 'Development', color: 'text-amber-600' },
                    { label: 'Trạng thái Database', value: 'Đã kết nối ✓', color: 'text-emerald-600' },
                    { label: 'API Server', value: 'localhost:4000', color: 'text-blue-600' },
                    { label: 'Admin Server', value: 'localhost:3000', color: 'text-blue-600' },
                    { label: 'Ngôn ngữ Backend', value: 'Node.js + NestJS', color: 'text-slate-800' },
                    { label: 'Database', value: 'PostgreSQL + Prisma ORM', color: 'text-slate-800' },
                    { label: 'Frontend', value: 'Next.js 15 + Tailwind CSS', color: 'text-slate-800' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className={`text-sm font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <p className="text-xs text-slate-500 text-center">
                    Internal Company App · Được xây dựng với ❤️ · {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
