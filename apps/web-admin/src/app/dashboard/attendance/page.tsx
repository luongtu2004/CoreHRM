'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Search, Clock, MapPin, Calendar, User, LogIn, LogOut,
  CheckCircle2, AlertCircle, TrendingUp, Users, Timer, Camera, X, Eye,
  PenLine, Trash2, Plus, UserX
} from 'lucide-react';
import Image from 'next/image';
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
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [correctModal, setCorrectModal] = useState(false);
  const [correctForm, setCorrectForm] = useState({
    userId: '', date: new Date().toISOString().split('T')[0],
    checkIn: '08:00', checkOut: '17:30', status: 'PRESENT', note: ''
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const response = await api.get('/attendance');
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/users');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
  });

  const correctMutation = useMutation({
    mutationFn: async (data: any) => api.post('/attendance/admin/correct', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('✅ Đã lưu điều chỉnh chấm công!');
      setCorrectModal(false);
      setCorrectForm({ userId: '', date: new Date().toISOString().split('T')[0], checkIn: '08:00', checkOut: '17:30', status: 'PRESENT', note: '' });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi lưu!')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/attendance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('🗑️ Đã xóa bản ghi!');
    },
    onError: () => toast.error('Lỗi khi xóa!')
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Xóa bản ghi chấm công của "${name}"?`)) deleteMutation.mutate(id);
  };

  const records = Array.isArray(attendanceData) ? attendanceData : [];

  // Stats
  const today = new Date().toDateString();
  const todayRecords = records.filter((r: any) => new Date(r.createdAt).toDateString() === today);
  const checkedInToday = todayRecords.length;
  const checkedOutToday = todayRecords.filter((r: any) => r.checkOut).length;
  const uniqueUsers = new Set(records.map((r: any) => r.userId)).size;
  const onTimeCount = records.filter((r: any) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
  const lateCount = records.filter((r: any) => r.status === 'LATE').length;

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
      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-4 -right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
            <img
              src={previewPhoto}
              alt="Ảnh selfie chấm công"
              className="w-full rounded-2xl shadow-2xl object-cover"
            />
            <p className="mt-3 text-center text-sm text-white/70">Ảnh selfie xác thực chấm công</p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDetailRecord(null)}
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Chi tiết chấm công</h2>
              <button
                onClick={() => setDetailRecord(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md shadow-blue-500/20">
                  {detailRecord.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{detailRecord.user?.name}</h3>
                  <p className="text-sm text-slate-500">{detailRecord.user?.email}</p>
                </div>
                <div className="ml-auto">
                  <Badge className={getStatusBadge(detailRecord.status).cls}>
                    {getStatusBadge(detailRecord.status).label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <LogIn className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-900">Giờ vào</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-700 mb-1">{formatTime(detailRecord.createdAt)}</div>
                    <div className="text-xs text-emerald-600">{formatDate(detailRecord.createdAt)}</div>
                  </div>
                  
                  <div className="rounded-2xl bg-rose-50/50 p-4 border border-rose-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span className="text-sm font-semibold text-rose-900">Giờ ra</span>
                    </div>
                    <div className="text-xl font-bold text-rose-700 mb-1">
                      {detailRecord.checkOut ? formatTime(detailRecord.checkOut) : '--:--'}
                    </div>
                    <div className="text-xs text-rose-600">
                      {detailRecord.checkOut ? formatDate(detailRecord.checkOut) : 'Chưa chấm ra'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Vị trí & Ảnh xác thực</h4>
                  
                  <div className="rounded-2xl border border-slate-100 p-4 space-y-4">
                    <div className="flex gap-4">
                      {detailRecord.photoIn ? (
                        <img src={detailRecord.photoIn} alt="In" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 cursor-pointer" onClick={() => setPreviewPhoto(detailRecord.photoIn)} />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100"><Camera className="h-5 w-5 text-slate-300" /></div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Check-in</p>
                        <p className="text-sm text-slate-500 mb-1 leading-snug">{detailRecord.locationIn || 'Không có dữ liệu vị trí'}</p>
                        {detailRecord.checkInLat && (
                          <p className="text-xs font-mono text-slate-400">{detailRecord.checkInLat}, {detailRecord.checkInLng}</p>
                        )}
                      </div>
                    </div>

                    {detailRecord.checkOut && (
                      <>
                        <div className="h-px bg-slate-100 w-full" />
                        <div className="flex gap-4">
                          {detailRecord.photoOut ? (
                            <img src={detailRecord.photoOut} alt="Out" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 cursor-pointer" onClick={() => setPreviewPhoto(detailRecord.photoOut)} />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100"><Camera className="h-5 w-5 text-slate-300" /></div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Check-out</p>
                            <p className="text-sm text-slate-500 mb-1 leading-snug">{detailRecord.locationOut || 'Không có dữ liệu vị trí'}</p>
                            {detailRecord.checkOutLat && (
                              <p className="text-xs font-mono text-slate-400">{detailRecord.checkOutLat}, {detailRecord.checkOutLng}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {detailRecord.note && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Ghi chú</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{detailRecord.note}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button onClick={() => setDetailRecord(null)}>Đóng lại</Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý chấm công</h1>
          <p className="text-gray-500">Theo dõi giờ vào/ra của toàn bộ nhân viên trong công ty.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCorrectModal(true)}
            className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-5 shadow-sm shadow-blue-500/30 hover:shadow-md transition-all"
          >
            <PenLine className="h-4 w-4" />
            <span>Điều chỉnh thủ công</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
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
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Đúng giờ</p>
              <p className="mt-1.5 text-3xl font-bold text-emerald-600">{onTimeCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm shadow-blue-500/20">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">lượt đúng giờ</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Đi muộn</p>
              <p className="mt-1.5 text-3xl font-bold text-amber-600">{lateCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/20">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">lượt đi muộn</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Vắng mặt</p>
              <p className="mt-1.5 text-3xl font-bold text-rose-600">{absentCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-red-500 shadow-sm shadow-rose-500/20">
              <UserX className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">lượt vắng mặt</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Ra hôm nay</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-800">{checkedOutToday}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-sm shadow-violet-500/20">
              <LogOut className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">nhân viên đã check-out</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Tổng NV</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-800">{uniqueUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 shadow-sm shadow-slate-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">nhân viên có dữ liệu</p>
        </div>
      </div>

      {/* Manual Correction Modal */}
      {correctModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCorrectModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <PenLine className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Điều chỉnh thủ công</h2>
                  <p className="text-xs text-slate-500">Tạo hoặc cập nhật bản ghi chấm công</p>
                </div>
              </div>
              <button onClick={() => setCorrectModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nhân viên *</label>
                <select
                  value={correctForm.userId}
                  onChange={e => setCorrectForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {Array.isArray(usersData) && usersData.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày *</label>
                <input type="date" value={correctForm.date}
                  onChange={e => setCorrectForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giờ vào</label>
                  <input type="time" value={correctForm.checkIn}
                    onChange={e => setCorrectForm(f => ({ ...f, checkIn: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giờ ra</label>
                  <input type="time" value={correctForm.checkOut}
                    onChange={e => setCorrectForm(f => ({ ...f, checkOut: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái</label>
                <select value={correctForm.status}
                  onChange={e => setCorrectForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="PRESENT">Đúng giờ</option>
                  <option value="LATE">Đi muộn</option>
                  <option value="EARLY_LEAVE">Về sớm</option>
                  <option value="ABSENT">Vắng mặt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú / Lý do</label>
                <textarea value={correctForm.note} rows={2}
                  onChange={e => setCorrectForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Nhập lý do điều chỉnh..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setCorrectModal(false)}>Hủy</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!correctForm.userId || !correctForm.date || correctMutation.isPending}
                onClick={() => correctMutation.mutate(correctForm)}
              >
                {correctMutation.isPending ? 'Đang lưu...' : 'Lưu điều chỉnh'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ảnh xác thực</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Vị trí GPS</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
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
                  {/* Ảnh selfie xác thực */}
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {record.photoIn ? (
                        <button
                          onClick={() => setPreviewPhoto(record.photoIn)}
                          className="group relative overflow-hidden rounded-xl ring-2 ring-slate-200 hover:ring-blue-400 transition-all"
                          title="Ảnh check-in"
                        >
                          <img
                            src={record.photoIn}
                            alt="check-in"
                            className="h-10 w-10 object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                            <LogIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                          <Camera className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                      {record.photoOut ? (
                        <button
                          onClick={() => setPreviewPhoto(record.photoOut)}
                          className="group relative overflow-hidden rounded-xl ring-2 ring-slate-200 hover:ring-rose-400 transition-all"
                          title="Ảnh check-out"
                        >
                          <img
                            src={record.photoOut}
                            alt="check-out"
                            className="h-10 w-10 object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                            <LogOut className="h-3 w-3 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ) : record.photoIn ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 ring-2 ring-amber-100" title="Chưa check-out">
                          <Clock className="h-4 w-4 text-amber-400" />
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-500 max-w-[220px]">
                      {record.locationIn || record.checkInLat ? (
                        <>
                          <div 
                            className="flex items-center gap-1 cursor-help" 
                            title={record.locationIn || `${record.checkInLat?.toFixed(4)}, ${record.checkInLng?.toFixed(4)}`}
                          >
                            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">Vào: {record.locationIn || `${record.checkInLat?.toFixed(4)}, ${record.checkInLng?.toFixed(4)}`}</span>
                          </div>
                          {(record.locationOut || record.checkOutLat) && (
                            <div 
                              className="flex items-center gap-1 cursor-help mt-1" 
                              title={record.locationOut || `${record.checkOutLat?.toFixed(4)}, ${record.checkOutLng?.toFixed(4)}`}
                            >
                              <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                              <span className="truncate">Ra: {record.locationOut || `${record.checkOutLat?.toFixed(4)}, ${record.checkOutLng?.toFixed(4)}`}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailRecord(record)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id, record.user?.name || 'N/A')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Xóa bản ghi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
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
