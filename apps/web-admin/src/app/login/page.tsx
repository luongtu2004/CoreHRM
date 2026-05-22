'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, BarChart3, Users, CheckSquare } from 'lucide-react';

import { CoreHRMLogo } from '@/components/ui/CoreHRMLogo';

const features = [
  { icon: Users, text: 'Quản lý nhân sự & phân quyền' },
  { icon: CheckSquare, text: 'Theo dõi công việc thời gian thực' },
  { icon: BarChart3, text: 'Báo cáo & phân tích chuyên sâu' },
  { icon: ShieldCheck, text: 'Bảo mật dữ liệu doanh nghiệp' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Đăng nhập thành công! Chào mừng trở lại.');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* ── LEFT PANEL — Branding ── */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[58%] flex-col overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />

        {/* Animated blobs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl animate-pulse [animation-delay:2s]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center">
            <CoreHRMLogo variant="horizontal" size="md" theme="light" />
          </div>

          {/* Center content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Hệ thống quản lý<br />
                <span className="text-blue-200">nội bộ doanh nghiệp</span>
              </h1>
              <p className="mt-4 text-blue-100 text-lg leading-relaxed max-w-md">
                Nền tảng tập trung giúp đội nhóm làm việc hiệu quả hơn, đồng bộ hơn và bảo mật hơn.
              </p>
            </div>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-blue-50 leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5">
            <p className="text-sm text-blue-100 italic leading-relaxed">
              "Công cụ giúp chúng tôi quản lý toàn bộ nhân sự và công việc chỉ trong một nơi duy nhất."
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 flex items-center justify-center text-xs font-bold text-white">
                NV
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Nguyễn Văn A</p>
                <p className="text-[11px] text-blue-300">Giám đốc điều hành</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16 bg-slate-50/50">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center mb-10 lg:hidden">
            <CoreHRMLogo variant="horizontal" size="md" theme="dark" />
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
            <p className="text-slate-500 text-sm mt-1.5">Nhập thông tin tài khoản để tiếp tục.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ten@congty.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
                <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12 hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" className="peer sr-only" />
                <div className="h-4 w-4 rounded-[4px] border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all" />
              </div>
              <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Hoặc</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Quick fill hint */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
            <p className="text-xs font-semibold text-blue-700 mb-1.5">🔑 Tài khoản demo</p>
            <button
              type="button"
              onClick={() => { setEmail('admin@example.com'); setPassword('123456'); }}
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-mono bg-white/70 rounded-lg px-2.5 py-1.5 border border-blue-200 hover:bg-white transition-all w-full text-left"
            >
              admin@example.com / 123456 <span className="float-right text-blue-400">→ Điền tự động</span>
            </button>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CoreHRM · Dành cho nội bộ doanh nghiệp
          </p>
        </div>
      </div>
    </div>
  );
}
