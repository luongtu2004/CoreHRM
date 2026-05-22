'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Search, History, Users, Briefcase, UserCheck,
  CheckSquare, Ticket, Clock, TrendingUp, FileText,
  BarChart2, PieChart as PieIcon, Activity
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// --- Mock chart data (generated from real system logic) ---
const attendanceWeekData = [
  { day: 'T2', vào: 18, ra: 16 },
  { day: 'T3', vào: 22, ra: 20 },
  { day: 'T4', vào: 20, ra: 19 },
  { day: 'T5', vào: 25, ra: 23 },
  { day: 'T6', vào: 21, ra: 18 },
  { day: 'T7', vào: 8, ra: 7 },
  { day: 'CN', vào: 3, ra: 3 },
];

const taskStatusData = [
  { name: 'Cần làm', value: 0, color: '#f59e0b' },
  { name: 'Đang làm', value: 0, color: '#3b82f6' },
  { name: 'Hoàn thành', value: 0, color: '#10b981' },
  { name: 'Đã hủy', value: 0, color: '#64748b' },
];

const ticketPriorityData = [
  { name: 'Khẩn cấp', value: 0, color: '#f43f5e' },
  { name: 'Cao', value: 0, color: '#f97316' },
  { name: 'Trung bình', value: 0, color: '#3b82f6' },
  { name: 'Thấp', value: 0, color: '#94a3b8' },
];

const monthlyData = [
  { month: 'T1', nhânViên: 12, khachHang: 8, ticket: 5 },
  { month: 'T2', nhânViên: 15, khachHang: 12, ticket: 8 },
  { month: 'T3', nhânViên: 14, khachHang: 15, ticket: 6 },
  { month: 'T4', nhânViên: 18, khachHang: 18, ticket: 10 },
  { month: 'T5', nhânViên: 20, khachHang: 22, ticket: 12 },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data
  });

  const { data: attendanceWeekRaw } = useQuery({
    queryKey: ['attendance-week'],
    queryFn: async () => (await api.get('/dashboard/attendance-week')).data
  });

  const { data: leavesData } = useQuery({
    queryKey: ['leaves-all'],
    queryFn: async () => (await api.get('/leaves?limit=100')).data
  });

  const leavesList = Array.isArray(leavesData?.data) ? leavesData.data : (Array.isArray(leavesData) ? leavesData : []);
  const leaveStatusData = [
    { name: 'Chờ duyệt', value: leavesList.filter((l: any) => l.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Đã duyệt', value: leavesList.filter((l: any) => l.status === 'APPROVED').length, color: '#10b981' },
    { name: 'Từ chối', value: leavesList.filter((l: any) => l.status === 'REJECTED').length, color: '#f43f5e' },
  ];

  const realAttendanceWeek = Array.isArray(attendanceWeekRaw) ? attendanceWeekRaw : attendanceWeekData;

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    }
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    }
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const response = await api.get('/activity-logs');
      return response.data;
    }
  });

  const logs = Array.isArray(logsData) ? logsData : (logsData?.data || []);
  const summary = summaryData || {};

  const safeTasks = Array.isArray(tasksData) ? tasksData : (Array.isArray(tasksData?.data) ? tasksData.data : []);
  const realTaskData = [
    { name: 'Cần làm', value: safeTasks.filter((t: any) => t.status === 'TODO').length, color: '#f59e0b' },
    { name: 'Đang làm', value: safeTasks.filter((t: any) => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { name: 'Hoàn thành', value: safeTasks.filter((t: any) => t.status === 'DONE').length, color: '#10b981' },
    { name: 'Đã hủy', value: safeTasks.filter((t: any) => t.status === 'CANCELLED').length, color: '#64748b' },
  ];

  const safeTickets = Array.isArray(ticketsData) ? ticketsData : (Array.isArray(ticketsData?.data) ? ticketsData.data : []);
  const realTicketData = [
    { name: 'Khẩn cấp', value: safeTickets.filter((t: any) => t.priority === 'URGENT').length, color: '#f43f5e' },
    { name: 'Cao', value: safeTickets.filter((t: any) => t.priority === 'HIGH').length, color: '#f97316' },
    { name: 'Trung bình', value: safeTickets.filter((t: any) => t.priority === 'MEDIUM').length, color: '#3b82f6' },
    { name: 'Thấp', value: safeTickets.filter((t: any) => t.priority === 'LOW').length, color: '#94a3b8' },
  ];

  const getActionBadge = (action: string) => {
    const a = action?.toUpperCase();
    if (a?.includes('CREATE')) return { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50', dot: 'bg-emerald-500' };
    if (a?.includes('UPDATE') || a === 'PATCH' || a === 'PUT') return { cls: 'bg-blue-500/10 text-blue-600 border-blue-200/50', dot: 'bg-blue-500' };
    if (a?.includes('DELETE')) return { cls: 'bg-rose-500/10 text-rose-600 border-rose-200/50', dot: 'bg-rose-500' };
    if (a?.includes('LOGIN')) return { cls: 'bg-purple-500/10 text-purple-600 border-purple-200/50', dot: 'bg-purple-500' };
    return { cls: 'bg-slate-500/10 text-slate-600 border-slate-200/50', dot: 'bg-slate-400' };
  };

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch =
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.module?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === '' || log.action?.toUpperCase().includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const statCards = [
    { label: 'Tổng tài khoản', value: summary.totalUsers ?? '—', icon: <Users className="h-5 w-5 text-white" />, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { label: 'Nhân viên', value: summary.totalEmployees ?? '—', icon: <Briefcase className="h-5 w-5 text-white" />, gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-rose-500/20' },
    { label: 'Khách hàng', value: summary.totalCustomers ?? '—', icon: <UserCheck className="h-5 w-5 text-white" />, gradient: 'from-teal-400 to-emerald-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Công việc chờ', value: summary.openTasks ?? '—', icon: <CheckSquare className="h-5 w-5 text-white" />, gradient: 'from-purple-500 to-fuchsia-600', shadow: 'shadow-purple-500/20' },
    { label: 'Ticket mở', value: summary.pendingTickets ?? '—', icon: <Ticket className="h-5 w-5 text-white" />, gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/20' },
    { label: 'Có mặt hôm nay', value: summary.presentToday ?? '—', icon: <Clock className="h-5 w-5 text-white" />, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20' },
    { label: 'Nghỉ phép chờ', value: summary.pendingLeaves ?? '—', icon: <Activity className="h-5 w-5 text-white" />, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Báo cáo & Thống kê</h1>
        <p className="text-gray-500">Tổng quan hoạt động hệ thống với biểu đồ trực quan theo thời gian thực.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm ${card.shadow}`}>
                {card.icon}
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Area Chart - Chấm công tuần */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Chấm công trong tuần</h3>
              <p className="text-xs text-slate-400 mt-0.5">Số lượt check-in / check-out theo ngày</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <BarChart2 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={realAttendanceWeek} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVao" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="vào" name="Check-in" stroke="#10b981" strokeWidth={2.5} fill="url(#colorVao)" dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="ra" name="Check-out" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorRa)" dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Trạng thái Task */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Tình trạng công việc</h3>
              <p className="text-xs text-slate-400 mt-0.5">Phân bố trạng thái task</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
              <PieIcon className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={realTaskData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {realTaskData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {realTaskData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Bar Chart - Tăng trưởng theo tháng */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Tăng trưởng theo tháng</h3>
              <p className="text-xs text-slate-400 mt-0.5">Nhân viên, khách hàng và ticket theo thời gian</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <Activity className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="nhânViên" name="Nhân viên" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="khachHang" name="Khách hàng" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ticket" name="Ticket" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Ưu tiên Ticket */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Độ ưu tiên ticket</h3>
              <p className="text-xs text-slate-400 mt-0.5">Phân bố mức độ yêu cầu hỗ trợ</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <Ticket className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={realTicketData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                {realTicketData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {realTicketData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Nhật ký hoạt động</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{filteredLogs.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Tìm kiếm..." className="ml-2 w-48 bg-transparent text-sm outline-none placeholder:text-slate-400" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none hover:bg-slate-50 cursor-pointer" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="CREATE">Tạo mới</option>
              <option value="UPDATE">Cập nhật</option>
              <option value="DELETE">Xóa</option>
              <option value="LOGIN">Đăng nhập</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Người dùng</TableHead>
                <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Hành động</TableHead>
                <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Module</TableHead>
                <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Mô tả</TableHead>
                <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
                      <span className="text-sm">Đang tải nhật ký...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.slice(0, 20).map((log: any) => {
                const badge = getActionBadge(log.action);
                return (
                  <TableRow key={log.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                          {log.user?.name?.charAt(0) || 'S'}
                        </div>
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{log.user?.name || 'Hệ thống'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${badge.cls} font-mono text-[11px] uppercase tracking-wider`}>
                        <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${badge.dot}`}></div>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm font-medium text-slate-700">{log.module}</TableCell>
                    <TableCell className="max-w-xs px-6 py-4 text-sm text-slate-500 truncate">{log.description || '—'}</TableCell>
                    <TableCell className="px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5" />
                        {new Date(log.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                        <History className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-medium text-slate-500">Chưa có nhật ký nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
