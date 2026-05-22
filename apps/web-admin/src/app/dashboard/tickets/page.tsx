'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Edit, Trash2, Ticket, User, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import FormDrawer from '@/components/ui/FormDrawer';
import { toast } from 'sonner';

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', customerId: '', priority: 'MEDIUM', status: 'OPEN', assignedTo: '', note: '' });

  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });
  const { data: customersData } = useQuery({ queryKey: ['customers'], queryFn: async () => (await api.get('/customers')).data });
  const { data: ticketsResponse, isLoading } = useQuery({ queryKey: ['tickets'], queryFn: async () => (await api.get('/tickets?limit=1000')).data });

  const safeUsers = Array.isArray(usersData) ? usersData : (Array.isArray(usersData?.data) ? usersData.data : []);
  const safeCustomers = Array.isArray(customersData) ? customersData : (Array.isArray(customersData?.data) ? customersData.data : []);
  const dataList = Array.isArray(ticketsResponse?.data) ? ticketsResponse.data : (Array.isArray(ticketsResponse) ? ticketsResponse : []);

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsAddOpen(false);
      setFormData({ title: '', customerId: '', priority: 'MEDIUM', status: 'OPEN', assignedTo: '', note: '' });
      toast.success('Thêm ticket thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi thêm')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/tickets/${selectedItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsEditOpen(false);
      toast.success('Cập nhật thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi cập nhật')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsDeleteOpen(false);
      toast.success('Xóa thành công');
    },
    onError: (error: any) => toast.error('Lỗi khi xóa')
  });

  const handleAddSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const payload = { ...formData } as any;
    if (!payload.customerId) payload.customerId = null;
    if (!payload.assignedTo) payload.assignedTo = null;
    createMutation.mutate(payload); 
  };
  const handleEditSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const payload = { ...formData } as any;
    if (!payload.customerId) payload.customerId = null;
    if (!payload.assignedTo) payload.assignedTo = null;
    updateMutation.mutate(payload); 
  };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({ title: item.title, customerId: item.customerId || '', priority: item.priority, status: item.status, assignedTo: item.assignedTo || '', note: item.note || '' });
    setIsEditOpen(true);
  };
  const openDelete = (item: any) => { setSelectedItem(item); setIsDeleteOpen(true); };

  const filteredData = dataList.filter((item: any) => {
    const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil((filteredData?.length || 0) / PAGE_SIZE);
  const paginatedData = filteredData?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-500/10 text-rose-600 border-rose-200/50 dot-rose-500';
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border-orange-200/50 dot-orange-500';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-600 border-blue-200/50 dot-blue-500';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200/50 dot-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dot-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-600 border-blue-200/50 dot-blue-500';
      case 'CLOSED': return 'bg-slate-500/10 text-slate-600 border-slate-200/50 dot-slate-500';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-200/50 dot-amber-500';
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-500/15';
  const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-500/15 cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">phiếu hỗ trợ (Tickets)</h1>
          <p className="text-gray-500">Quản lý các yêu cầu hỗ trợ từ khách hàng.</p>
        </div>
        <Button className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /><span>Tạo phiếu mới</span>
        </Button>
      </div>

      <FormDrawer open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tạo phiếu hỗ trợ mới" subtitle="Điền thông tin yêu cầu" accentColor="blue">
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tiêu đề vấn đề</label>
            <input required type="text" placeholder="VD: Không đăng nhập được hệ thống" className={inputCls} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Khách hàng</label>
            <select required className={selectCls} value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
              <option value="">-- Chọn khách hàng --</option>
              {safeCustomers.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Ưu tiên</label>
              <select className={selectCls} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Người phụ trách</label>
              <select className={selectCls} value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                <option value="">-- Chưa giao --</option>
                {safeUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tạo mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Cập nhật phiếu hỗ trợ" subtitle={selectedItem?.title} accentColor="blue">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
            <input required type="text" className={inputCls} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select className={selectCls} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="OPEN">Mới</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="RESOLVED">Đã xử lý</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Người phụ trách</label>
            <select className={selectCls} value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
              <option value="">-- Chưa giao --</option>
              {safeUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Ghi chú / Phản hồi (Gửi cho NV)</label>
            <textarea className={`${inputCls} min-h-[100px] resize-y`} placeholder="Nhập ghi chú hoặc phản hồi giải quyết sự cố..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu
            </Button>
          </div>
        </form>
      </FormDrawer>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xóa phiếu hỗ trợ</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa phiếu này?</p></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedItem.id)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm phiếu..." className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="OPEN">Mới</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="RESOLVED">Đã xử lý</option>
            <option value="CLOSED">Đã đóng</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Mã & Tiêu đề</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ưu tiên</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Phụ trách</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Đang tải...</TableCell></TableRow>
            ) : paginatedData?.map((ticket: any) => (
              <TableRow key={ticket.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold text-white shadow-sm shadow-cyan-500/20 ring-2 ring-white">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-semibold text-slate-800 transition-colors group-hover:text-cyan-600 max-w-[200px] truncate">{ticket.title}</span>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <User className="h-3 w-3" />
                        <span>
                          {ticket.customer 
                            ? `Khách: ${ticket.customer.name}` 
                            : (ticket.creator ? `Nhân viên: ${ticket.creator.name}` : 'Ẩn danh')}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={getPriorityBadge(ticket.priority).replace('dot-', '')}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getPriorityBadge(ticket.priority).match(/dot-([a-z-0-9]+)/)?.[1] || 'bg-slate-400'}`}></div>
                    {ticket.priority === 'URGENT' ? 'Khẩn cấp' : ticket.priority === 'HIGH' ? 'Cao' : ticket.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={getStatusBadge(ticket.status).replace('dot-', '')}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getStatusBadge(ticket.status).match(/dot-([a-z-0-9]+)/)?.[1] || 'bg-slate-400'}`}></div>
                    {ticket.status === 'RESOLVED' ? 'Đã xử lý' : ticket.status === 'IN_PROGRESS' ? 'Đang xử lý' : ticket.status === 'CLOSED' ? 'Đã đóng' : 'Mới'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <User className="mr-2 h-4 w-4 text-slate-400" />
                    {ticket.assignedUser?.name || 'Chưa giao'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus-within:opacity-100 sm:opacity-100 md:opacity-0 md:translate-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ticket)} className="h-10 w-10 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all"><Edit className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(ticket)} className="h-10 w-10 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all"><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData?.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy dữ liệu.</TableCell></TableRow>}
          </TableBody>
        </Table>

        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white/50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredData?.length || 0)}</span> trong <span className="font-semibold text-slate-800">{filteredData?.length}</span> phiếu
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
    </div>
  );
}
