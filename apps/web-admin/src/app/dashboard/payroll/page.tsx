'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  DollarSign, Plus, Loader2, Search, CheckCircle2,
  CreditCard, Users, TrendingUp, FileText, Sparkles,
  ChevronDown, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT: { label: 'Nháp', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

function GenerateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payroll/generate', { month, year });
      const d = (res as any).data || res;
      toast.success(`Tạo thành công ${d.created} phiếu lương! (Bỏ qua ${d.skipped} đã tồn tại)`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200/60">
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Tạo phiếu lương hàng loạt</h2>
            <p className="text-xs text-slate-500">Hệ thống sẽ tự động tính toán từ dữ liệu chấm công và nghỉ phép</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tháng</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400"
              >
                {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Năm</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2020}
                max={2030}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 text-sm text-amber-700">
            <p className="font-semibold mb-1">ℹ️ Cách tính lương</p>
            <ul className="text-xs space-y-0.5 text-amber-600">
              <li>• Lương cơ bản ÷ số ngày làm việc × ngày thực làm</li>
              <li>• Nghỉ có phép (có lương): không khấu trừ</li>
              <li>• Nghỉ không phép: khấu trừ theo ngày công</li>
              <li>• Phiếu đã tồn tại trong tháng sẽ bị bỏ qua</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Hủy</Button>
            <Button onClick={handleGenerate} disabled={loading} className="rounded-xl flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Tạo phiếu lương
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const { data: payslipsData, isLoading } = useQuery({
    queryKey: ['payroll', monthFilter, yearFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (monthFilter) params.append('month', monthFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/payroll?${params.toString()}`);
      return res.data;
    }
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/payroll/${id}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Đã xác nhận phiếu lương!');
    }
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/payroll/${id}/paid`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Đã đánh dấu đã thanh toán!');
    }
  });

  const payslips = Array.isArray(payslipsData?.data) ? payslipsData.data : (Array.isArray(payslipsData) ? payslipsData : []);

  const filteredPayslips = payslips.filter((p: any) =>
    !search || p.user?.name?.toLowerCase().includes(search.toLowerCase()) || p.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalNet = filteredPayslips.reduce((sum: number, p: any) => sum + (p.netSalary ?? 0), 0);
  const paidCount = filteredPayslips.filter((p: any) => p.status === 'PAID').length;
  const pendingCount = filteredPayslips.filter((p: any) => p.status !== 'PAID').length;

  const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Bảng lương</h1>
          <p className="text-slate-500 mt-0.5">Tạo và quản lý phiếu lương hàng tháng cho nhân viên.</p>
        </div>
        <Button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 rounded-full px-5">
          <Sparkles className="h-4 w-4" />
          Tạo phiếu lương
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Tổng phiếu lương', value: filteredPayslips.length, icon: FileText, grad: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20', sub: 'phiếu' },
          { label: 'Tổng lương net', value: fmt(totalNet), icon: DollarSign, grad: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20', sub: 'tổng cộng' },
          { label: 'Đã thanh toán', value: paidCount, icon: CheckCircle2, grad: 'from-purple-500 to-fuchsia-600', shadow: 'shadow-purple-500/20', sub: 'phiếu' },
          { label: 'Chưa thanh toán', value: pendingCount, icon: CreditCard, grad: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20', sub: 'phiếu' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{card.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
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
            placeholder="Tìm kiếm nhân viên..."
            className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none hover:bg-slate-50 cursor-pointer"
        >
          <option value="">Tất cả tháng</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none hover:bg-slate-50 cursor-pointer"
        >
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none hover:bg-slate-50 cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="PAID">Đã thanh toán</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Nhân viên</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Tháng/Năm</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Lương cơ bản</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Phụ cấp</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Khấu trừ</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Lương thực nhận</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Công</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                    <span className="text-sm">Đang tải phiếu lương...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPayslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <DollarSign className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-500">Chưa có phiếu lương nào</p>
                    <p className="text-sm text-slate-400">Nhấn "Tạo phiếu lương" để bắt đầu</p>
                    <Button onClick={() => setShowGenerate(true)} variant="outline" className="mt-2 rounded-full">
                      <Sparkles className="h-4 w-4 mr-2" />Tạo ngay
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPayslips.map((p: any) => {
              const cfg = statusConfig[p.status] ?? statusConfig.DRAFT;
              return (
                <TableRow key={p.id} className="group border-b border-slate-50 hover:bg-slate-50/80 transition-all duration-300">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                        {p.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{p.user?.name}</p>
                        <p className="text-xs text-slate-400">{p.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {p.month}/{p.year}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-700 font-medium">{fmt(p.baseSalary ?? 0)}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-emerald-600 font-medium">+{fmt(p.allowance ?? 0)}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-rose-500 font-medium">-{fmt(p.deduction ?? 0)}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-base font-bold text-slate-800">{fmt(p.netSalary ?? 0)}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-xs text-slate-500">
                      <p>{p.actualDays}/{p.workingDays} ngày</p>
                      {p.leavesPaid > 0 && <p className="text-emerald-600">Phép: {p.leavesPaid}ngày</p>}
                      {p.leavesUnpaid > 0 && <p className="text-rose-500">KL: {p.leavesUnpaid}ngày</p>}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={`${cfg.cls} flex items-center gap-1.5 w-fit`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {p.status === 'DRAFT' && (
                        <button
                          onClick={() => confirmMutation.mutate(p.id)}
                          className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Xác nhận
                        </button>
                      )}
                      {p.status === 'CONFIRMED' && (
                        <button
                          onClick={() => paidMutation.mutate(p.id)}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Thanh toán
                        </button>
                      )}
                      {p.status === 'PAID' && (
                        <span className="text-xs text-emerald-600 font-medium">✓ Đã xong</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['payroll'] })}
        />
      )}
    </div>
  );
}
