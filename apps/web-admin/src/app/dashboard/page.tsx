'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import {
  Users, Briefcase, UserCheck, CheckSquare, Ticket, Clock,
  TrendingUp, ArrowRight, LogIn, Activity, Shield,
  Building2, Plus, ChevronRight, CalendarDays
} from 'lucide-react';

// No static mock — real data from API below

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg text-xs backdrop-blur">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="font-bold text-emerald-600">{payload[0].value} nhân viên</p>
      </div>
    );
  }
  return null;
};

const actionColor = (action: string) => {
  const a = action?.toUpperCase();
  if (a?.includes('CREATE')) return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  if (a?.includes('UPDATE') || a === 'PATCH') return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (a?.includes('DELETE')) return { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' };
  if (a?.includes('LOGIN')) return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' };
  return { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
};

export default function DashboardPage() {
  const router = useRouter();

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary');
      return response.data;
    }
  });

  const { data: attendanceWeekRaw } = useQuery({
    queryKey: ['attendance-week'],
    queryFn: async () => (await api.get('/dashboard/attendance-week')).data
  });

  const attendanceWeekData = Array.isArray(attendanceWeekRaw)
    ? attendanceWeekRaw.map((d: any) => ({ day: d.day, value: d.và ?? 0 }))
    : [{ day: 'T2', value: 0 }, { day: 'T3', value: 0 }, { day: 'T4', value: 0 }, { day: 'T5', value: 0 }, { day: 'T6', value: 0 }, { day: 'T7', value: 0 }, { day: 'CN', value: 0 }];

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    }
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const s = summaryData || {};
  const safeTasks = Array.isArray(tasksData) ? tasksData : (Array.isArray((tasksData as any)?.data) ? (tasksData as any).data : []);
  const safeAttendance = Array.isArray(attendanceData) ? attendanceData : (Array.isArray((attendanceData as any)?.data) ? (attendanceData as any).data : []);

  const doneTasks = safeTasks.filter((t: any) => t.status === 'DONE').length;
  const totalTasks = safeTasks.length;
  const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const today = new Date().toDateString();
  const todayCheckedIn = safeAttendance.filter((r: any) => new Date(r.createdAt).toDateString() === today).length;

  const radialData = [{ name: 'Hoàn thành', value: taskPercent, fill: '#10b981' }];

  const statCards = [
    {
      label: 'Tổng tài khoản', value: s.totalUsers ?? '—',
      icon: <Users className="h-5 w-5 text-white" />,
      gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25',
      change: '+2 tuần này', positive: true,
      onClick: () => router.push('/dashboard/users')
    },
    {
      label: 'Nhân viên', value: s.totalEmployees ?? '—',
      icon: <Briefcase className="h-5 w-5 text-white" />,
      gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-rose-500/25',
      change: 'Đang hoạt động', positive: true,
      onClick: () => router.push('/dashboard/employees')
    },
    {
      label: 'Khách hàng', value: s.totalCustomers ?? '—',
      icon: <UserCheck className="h-5 w-5 text-white" />,
      gradient: 'from-teal-400 to-emerald-600', shadow: 'shadow-emerald-500/25',
      change: '+5 tháng này', positive: true,
      onClick: () => router.push('/dashboard/customers')
    },
    {
      label: 'Công việc đang chờ', value: s.openTasks ?? '—',
      icon: <CheckSquare className="h-5 w-5 text-white" />,
      gradient: 'from-purple-500 to-fuchsia-600', shadow: 'shadow-purple-500/25',
      change: `${taskPercent}% hoàn thành`, positive: taskPercent > 50,
      onClick: () => router.push('/dashboard/tasks')
    },
    {
      label: 'Ticket hỗ trợ', value: s.pendingTickets ?? '—',
      icon: <Ticket className="h-5 w-5 text-white" />,
      gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/25',
      change: 'Cần xử lý', positive: false,
      onClick: () => router.push('/dashboard/tickets')
    },
    {
      label: 'Có mặt hôm nay', value: todayCheckedIn || s.presentToday || '—',
      icon: <Clock className="h-5 w-5 text-white" />,
      gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/25',
      change: 'nhân viên check-in', positive: true,
      onClick: () => router.push('/dashboard/attendance')
    },
    {
      label: 'Nghỉ phép chờ', value: s.pendingLeaves ?? '—',
      icon: <CalendarDays className="h-5 w-5 text-white" />,
      gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25',
      change: 'cần phê duyệt', positive: false,
      onClick: () => router.push('/dashboard/leaves')
    },
  ];

  const quickActions = [
    { label: 'Thêm tài khoản', icon: <Users className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100', onClick: () => router.push('/dashboard/users') },
    { label: 'Công việc mới', icon: <CheckSquare className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100', onClick: () => router.push('/dashboard/tasks') },
    { label: 'Thêm khách hàng', icon: <UserCheck className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100', onClick: () => router.push('/dashboard/customers') },
    { label: 'Tạo ticket', icon: <Ticket className="h-4 w-4" />, color: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100', onClick: () => router.push('/dashboard/tickets') },
    { label: 'Phân quyền', icon: <Shield className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100', onClick: () => router.push('/dashboard/roles') },
    { label: 'Phòng ban', icon: <Building2 className="h-4 w-4" />, color: 'text-orange-600 bg-orange-50 hover:bg-orange-100', onClick: () => router.push('/dashboard/departments') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảng điều khiển</h1>
          <p className="text-slate-500 mt-0.5">
            Chào mừng trở lại! Đây là tổng quan hoạt động hôm nay —{' '}
            <span className="font-medium text-slate-700">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500"></div>
          <span className="text-xs font-medium text-emerald-600">Hệ thống đang hoạt động</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        {statCards.map((card, i) => (
          <button
            key={i}
            onClick={card.onClick}
            className="group rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-left shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md ${card.shadow}`}>
                {card.icon}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? <span className="h-7 w-12 animate-pulse bg-slate-200 rounded inline-block"></span> : card.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{card.label}</p>
            <p className={`text-[11px] mt-1 font-medium ${card.positive ? 'text-emerald-600' : 'text-rose-500'}`}>{card.change}</p>
          </button>
        ))}
      </div>

      {/* Charts + Progress Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Area Chart - Chấm công tuần */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Chấm công tuần này</h3>
              <p className="text-xs text-slate-400 mt-0.5">Số nhân viên check-in theo ngày</p>
            </div>
            <button onClick={() => router.push('/dashboard/attendance')} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={attendanceWeekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="Có mặt" stroke="#10b981" strokeWidth={3} fill="url(#attendGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Completion Radial */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-slate-800">Tiến độ công việc</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tỉ lệ task hoàn thành</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center mt-2">
            <div className="relative w-full" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar dataKey="value" background={{ fill: '#f1f5f9' }} cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-black text-slate-800">{taskPercent}%</p>
                <p className="text-xs font-medium text-slate-500">hoàn thành</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            {[
              { label: 'Cần làm', count: safeTasks.filter((t: any) => t.status === 'TODO').length, color: 'bg-amber-400' },
              { label: 'Đang làm', count: safeTasks.filter((t: any) => t.status === 'IN_PROGRESS').length, color: 'bg-blue-500' },
              { label: 'Hoàn thành', count: doneTasks, color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.color}`}></div>
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Plus className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-800">Thao tác nhanh</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className={`flex items-center gap-2.5 rounded-xl p-3.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${action.color}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Activity className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-800">Hoạt động gần đây</h3>
            </div>
            <button onClick={() => router.push('/dashboard/reports')} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 shrink-0"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (s.recentActivities || []).length > 0 ? (
              s.recentActivities.slice(0, 10).map((activity: any) => {
                const col = actionColor(activity.action);
                return (
                  <div key={activity.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs text-white bg-gradient-to-br from-slate-400 to-slate-600 shadow-sm ring-2 ring-white`}>
                      {activity.user?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 truncate">{activity.user?.name || 'Hệ thống'}</span>
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${col.bg} ${col.text}`}>
                          {activity.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{activity.module} — {activity.description || 'Không có mô tả'}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-10 w-10 text-slate-200 mb-2" />
                <p className="text-sm font-medium text-slate-400">Chưa có hoạt động nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
