'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Search, Clock, MapPin, Calendar, User, LogIn, LogOut,
  CheckCircle2, AlertCircle, TrendingUp, Users, Timer
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const response = await api.get('/attendance');
      return response.data;
    }
  });

  const checkInMutation = useMutation({
    mutationFn: async () => await api.post('/attendance/check-in', { location: 'Văn phòng' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('✅ Chấm công vào thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đã chấm công hôm nay rồi!');
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => await api.post('/attendance/check-out', { location: 'Văn phòng' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('✅ Chấm công ra thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Chưa chấm công vào hôm nay!');
    }
  });

  const records = Array.isArray(attendanceData) ? attendanceData : [];

  // Stats
  const today = new Date().toDateString();
  const todayRecords = records.filter((r: any) => new Date(r.createdAt).toDateString() === today);
  const checkedInToday = todayRecords.length;
  const checkedOutToday = todayRecords.filter((r: any) => r.checkOut).length;
  const uniqueUsers = new Set(records.map((r: any) => r.userId)).size;
  const onTimeCount = records.filter((r: any) => r.status === 'PRESENT').length;

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const calcWorkHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return '--';
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50', dot: 'bg-emerald-500', label: 'Đúng giờ' };
      case 'LATE': return { cls: 'bg-amber-500/10 text-amber-600 border-amber-200/50', dot: 'bg-amber-500', label: 'Đi muộn' };
      case 'EARLY_LEAVE': return { cls: 'bg-orange-500/10 text-orange-600 border-orange-200/50', dot: 'bg-orange-500', label: 'Về sớm' };
      case 'ABSENT': return { cls: 'bg-rose-500/10 text-rose-600 border-rose-200/50', dot: 'bg-rose-500', label: 'Vắng mặt' };
      default: return { cls: 'bg-slate-500/10 text-slate-600 border-slate-200/50', dot: 'bg-slate-400', label: status };
    }
  };

  const filteredRecords = records.filter((r: any) => {
    const matchesSearch = r.user?.name?.toLowerCase().includes(search.toLowerCase()) || r.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || r.status === statusFilter;
    const matchesDate = dateFilter === '' || new Date(r.createdAt).toISOString().split('T')[0] === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý chấm công</h1>
          <p className="text-gray-500">Theo dõi giờ vào/ra của toàn bộ nhân viên trong công ty.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 px-5 shadow-sm shadow-emerald-500/30 hover:shadow-md transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span>Chấm vào</span>
          </Button>
          <Button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            variant="outline"
            className="flex items-center gap-2 rounded-full px-5 border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Chấm ra</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Vào hôm nay</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-800">{checkedInToday}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shadow-emerald-500/20">
              <LogIn className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">nhân viên đã check-in</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Ra hôm nay</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-800">{checkedOutToday}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm shadow-blue-500/20">
              <LogOut className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">nhân viên đã check-out</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Tổng nhân viên</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-800">{uniqueUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-sm shadow-purple-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">có lịch sử chấm công</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Đúng giờ</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-800">{onTimeCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-orange-500/20">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">lần chấm công đúng giờ</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex flex-1 min-w-[200px] items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 focus:border-blue-500 cursor-pointer"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 focus:border-blue-500 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PRESENT">Đúng giờ</option>
            <option value="LATE">Đi muộn</option>
            <option value="EARLY_LEAVE">Về sớm</option>
            <option value="ABSENT">Vắng mặt</option>
          </select>
          {(search || statusFilter || dateFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); }}
              className="rounded-xl text-slate-500 hover:text-slate-800"
            >
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Nhân viên</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ngày</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Giờ vào</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Giờ ra</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Tổng giờ</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Vị trí</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
                    <span className="text-sm">Đang tải dữ liệu chấm công...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRecords.map((record: any) => {
              const badge = getStatusBadge(record.status);
              return (
                <TableRow key={record.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-blue-500/20 ring-2 ring-white">
                        {record.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 transition-colors group-hover:text-blue-600">{record.user?.name}</span>
                        <span className="text-xs text-slate-400">{record.user?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(record.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
                        <LogIn className="h-3.5 w-3.5" />
                      </div>
                      {formatTime(record.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {record.checkOut ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-rose-500">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50">
                          <LogOut className="h-3.5 w-3.5" />
                        </div>
                        {formatTime(record.checkOut)}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
                        Đang làm việc
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Timer className="h-4 w-4 text-slate-400" />
                      {calcWorkHours(record.createdAt, record.checkOut)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={`${badge.cls} hover:${badge.cls}`}>
                      <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${badge.dot}`}></div>
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      {record.locationIn && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-500" />
                          <span>Vào: {record.locationIn}</span>
                        </div>
                      )}
                      {record.locationOut && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500" />
                          <span>Ra: {record.locationOut}</span>
                        </div>
                      )}
                      {!record.locationIn && !record.locationOut && (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <Clock className="h-8 w-8 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-500">Không tìm thấy dữ liệu chấm công</p>
                      <p className="text-sm text-slate-400">Thử thay đổi bộ lọc hoặc khoảng thời gian</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
