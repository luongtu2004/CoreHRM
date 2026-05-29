'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CalendarDays, Plus, CheckCircle2, XCircle, Clock, Search,
  ChevronDown, Filter, AlertCircle, Loader2, CalendarCheck,
  CalendarX, CalendarClock, Send, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const statusConfig: Record<LeaveStatus, { label: string; cls: string; dot: string; icon: any }> = {
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: Clock },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: X },
};

function CreateLeaveModal({ leaveTypes, onClose, onSuccess }: {
  leaveTypes: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leaves', form);
      toast.success('Đã gửi yêu cầu nghỉ phép thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200/60">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Gửi đơn xin nghỉ phép</h2>
              <p className="text-xs text-slate-500">Điền thông tin yêu cầu nghỉ phép</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại nghỉ phép</label>
            <select
              value={form.leaveTypeId}
              onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            >
              <option value="">-- Chọn loại nghỉ phép --</option>
              {leaveTypes.map((lt: any) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.isPaid ? 'Có lương' : 'Không lương'}) — tối đa {lt.maxDaysPerYear} ngày/năm
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày kết thúc</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lý do nghỉ</label>
            <textarea
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Nhập lý do xin nghỉ phép..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-xl flex items-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApproveModal({ leave, action, onClose, onSuccess }: {
  leave: any;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/leaves/${leave.id}/${action}`, { note });
      toast.success(action === 'approve' ? 'Đã phê duyệt yêu cầu!' : 'Đã từ chối yêu cầu!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200/60">
        <div className={`flex items-center gap-3 p-5 rounded-t-2xl border-b border-slate-100 ${isApprove ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isApprove ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            {isApprove ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
          </div>
          <div>
            <h2 className={`font-bold ${isApprove ? 'text-emerald-800' : 'text-rose-800'}`}>
              {isApprove ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </h2>
            <p className="text-xs text-slate-500">{leave.user?.name} — {leave.leaveType?.name}</p>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <p><span className="font-semibold">Từ:</span> {new Date(leave.startDate).toLocaleDateString('vi-VN')}</p>
            <p><span className="font-semibold">Đến:</span> {new Date(leave.endDate).toLocaleDateString('vi-VN')}</p>
            <p><span className="font-semibold">Tổng:</span> {leave.totalDays} ngày</p>
            <p><span className="font-semibold">Lý do:</span> {leave.reason}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú {!isApprove && '(lý do từ chối)'}</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={isApprove ? 'Ghi chú thêm (tuỳ chọn)...' : 'Nhập lý do từ chối...'}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className={`rounded-xl flex items-center gap-2 ${isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isApprove ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />)}
              {isApprove ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeavesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [approveLeave, setApproveLeave] = useState<{ leave: any; action: 'approve' | 'reject' } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: leavesData, isLoading } = useQuery({
    queryKey: ['leaves', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/leaves?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 3000, // poll every 3s for pseudo-realtime
  });

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => (await api.get('/leaves/types')).data
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leaves/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Đã hủy yêu cầu nghỉ phép');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể hủy')
  });

  const leaves = Array.isArray(leavesData?.data) ? leavesData.data : (Array.isArray(leavesData) ? leavesData : []);

  const filteredLeaves = leaves.filter((l: any) => {
    const matchSearch = !search || l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.reason?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil((filteredLeaves?.length || 0) / PAGE_SIZE);
  const paginatedLeaves = filteredLeaves?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = {
    pending: leaves.filter((l: any) => l.status === 'PENDING').length,
    approved: leaves.filter((l: any) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l: any) => l.status === 'REJECTED').length,
    total: leaves.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nghỉ phép</h1>
          <p className="text-slate-500 mt-0.5">Theo dõi và phê duyệt yêu cầu nghỉ phép của nhân viên.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-full px-5 shadow-sm">
          <Plus className="h-4 w-4" />
          Xin nghỉ phép
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Tổng yêu cầu', value: stats.total, icon: CalendarDays, grad: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
          { label: 'Chờ duyệt', value: stats.pending, icon: CalendarClock, grad: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20' },
          { label: 'Đã duyệt', value: stats.approved, icon: CalendarCheck, grad: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
          { label: 'Từ chối', value: stats.rejected, icon: CalendarX, grad: 'from-rose-400 to-red-500', shadow: 'shadow-rose-500/20' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{card.label}</p>
                <p className="mt-1.5 text-3xl font-bold text-slate-800">{card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.grad} shadow-sm ${card.shadow}`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex flex-1 min-w-[200px] items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên, lý do..."
            className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s === '' ? 'Tất cả' : statusConfig[s as LeaveStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Nhân viên</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Loại nghỉ</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Thời gian</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Số ngày</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Lý do</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                    <span className="text-sm">Đang tải dữ liệu...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLeaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <CalendarDays className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-500">Không có yêu cầu nghỉ phép nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedLeaves.map((leave: any) => {
              const cfg = statusConfig[leave.status as LeaveStatus] ?? statusConfig.PENDING;
              const isPaid = leave.leaveType?.isPaid;
              return (
                <TableRow key={leave.id} className="group border-b border-slate-50 hover:bg-slate-50/80 transition-all duration-300">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                        {leave.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{leave.user?.name}</p>
                        <p className="text-xs text-slate-400">{leave.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{leave.leaveType?.name}</p>
                      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {isPaid ? 'Có lương' : 'Không lương'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      <p>{new Date(leave.startDate).toLocaleDateString('vi-VN')}</p>
                      <p className="text-slate-400">→ {new Date(leave.endDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                      {leave.totalDays}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 max-w-[200px]">
                    <p className="text-sm text-slate-600 truncate">{leave.reason}</p>
                    {leave.note && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">💬 {leave.note}</p>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge className={`${cfg.cls} flex items-center gap-1.5 w-fit`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </Badge>
                      {leave.status !== 'PENDING' && leave.approvedAt && (
                        <span className="text-[10px] text-slate-400 font-medium pl-1">
                          {new Date(leave.approvedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {leave.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setApproveLeave({ leave, action: 'approve' })}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-200 hover:shadow-md hover:shadow-emerald-100"
                            title="Duyệt"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setApproveLeave({ leave, action: 'reject' })}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 hover:shadow-md hover:shadow-rose-100"
                            title="Từ chối"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {leave.status !== 'PENDING' && (
                        <span className="text-xs text-emerald-600 font-medium mr-2">✓ Đã xử lý</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white/50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredLeaves?.length || 0)}</span> trong <span className="font-semibold text-slate-800">{filteredLeaves?.length}</span> yêu cầu
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                    currentPage === page
                      ? 'border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leave Types Info */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <h3 className="font-bold text-slate-800 mb-4">Các loại nghỉ phép</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {(leaveTypes as any[]).map((lt: any) => (
            <div key={lt.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="font-semibold text-sm text-slate-700">{lt.name}</p>
              <p className="text-xs text-slate-500 mt-1">Tối đa {lt.maxDaysPerYear} ngày/năm</p>
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${lt.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {lt.isPaid ? 'Có lương' : 'Không lương'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateLeaveModal
          leaveTypes={leaveTypes as any[]}
          onClose={() => setShowCreate(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['leaves'] })}
        />
      )}
      {approveLeave && (
        <ApproveModal
          leave={approveLeave.leave}
          action={approveLeave.action}
          onClose={() => setApproveLeave(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['leaves'] })}
        />
      )}
    </div>
  );
}
