'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Edit, Trash2, Building, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import FormDrawer from '@/components/ui/FormDrawer';
import { toast } from 'sonner';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', companyName: '', email: '', phone: '', status: 'NEW', source: 'WEBSITE' });

  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers')).data
  });
  const customers = customersResponse?.data || []; // Note: API returned nested data here based on previous file! Wait, actually let me use customersResponse if it's not nested. Wait, I'll fallback gracefully.
  const dataList = Array.isArray(customersResponse) ? customersResponse : customers;

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
      setFormData({ name: '', companyName: '', email: '', phone: '', status: 'NEW', source: 'WEBSITE' });
      toast.success('Thêm khách hàng thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi thêm')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/customers/${selectedItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditOpen(false);
      toast.success('Cập nhật thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi cập nhật')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsDeleteOpen(false);
      toast.success('Xóa thành công');
    },
    onError: (error: any) => toast.error('Lỗi khi xóa')
  });

  const handleAddSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData); };
  const handleEditSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(formData); };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({ name: item.name, companyName: item.companyName || '', email: item.email || '', phone: item.phone || '', status: item.status, source: item.source || '' });
    setIsEditOpen(true);
  };
  const openDelete = (item: any) => { setSelectedItem(item); setIsDeleteOpen(true); };

  const filteredData = dataList.filter((item: any) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || item.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil((filteredData?.length || 0) / PAGE_SIZE);
  const paginatedData = filteredData?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/10 text-blue-600 border-blue-200/50 dot-blue-500';
      case 'POTENTIAL': return 'bg-amber-500/10 text-amber-600 border-amber-200/50 dot-amber-500';
      case 'CUSTOMER': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dot-emerald-500';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200/50 dot-slate-500';
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15';
  const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý khách hàng</h1>
          <p className="text-gray-500">Theo dõi thông tin khách hàng và đầu mối liên hệ.</p>
        </div>
        <Button className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /><span>Thêm khách hàng</span>
        </Button>
      </div>

      <FormDrawer open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm khách hàng mới" subtitle="Điền thông tin khách hàng" accentColor="emerald">
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên liên hệ</label>
            <input required type="text" placeholder="VD: Trần Văn B" className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên công ty <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input type="text" placeholder="VD: Công ty ABC" className={inputCls} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input type="email" placeholder="VD: abc@company.com" className={inputCls} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Điện thoại</label>
            <input type="text" placeholder="VD: 0987 654 321" className={inputCls} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Thêm mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa thông tin khách hàng" subtitle={selectedItem?.name} accentColor="emerald">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên liên hệ</label>
            <input required type="text" className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select className={selectCls} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="NEW">Mới</option>
              <option value="POTENTIAL">Tiềm năng</option>
              <option value="CUSTOMER">Khách hàng</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi
            </Button>
          </div>
        </form>
      </FormDrawer>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xóa khách hàng</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa <strong>{selectedItem?.name}</strong>?</p></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedItem.id)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm khách hàng..." className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="NEW">Mới</option>
            <option value="POTENTIAL">Tiềm năng</option>
            <option value="CUSTOMER">Khách hàng</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Khách hàng</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Công ty</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-slate-400">Đang tải...</TableCell></TableRow>
            ) : paginatedData?.map((customer: any) => (
              <TableRow key={customer.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 ring-2 ring-white">
                      {customer.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-semibold text-slate-800 transition-colors group-hover:text-teal-600">{customer.name}</span>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <Mail className="h-3 w-3" /><span>{customer.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <Phone className="h-3 w-3" /><span>{customer.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    <Building className="mr-2 h-4 w-4 text-slate-400" />{customer.companyName || 'Cá nhân'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={`inline-flex items-center justify-center px-2.5 py-1 ${getStatusBadge(customer.status).split(' dot-')[0]}`}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full bg-${getStatusBadge(customer.status).match(/dot-([a-z-0-9-]+)/)?.[1] || 'slate-400'}`}></div>
                    <span>{customer.status === 'NEW' ? 'Mới' : customer.status === 'POTENTIAL' ? 'Tiềm năng' : customer.status === 'CUSTOMER' ? 'Khách hàng' : customer.status}</span>
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => openEdit(customer)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-200 hover:shadow-md hover:shadow-amber-100"><Edit className="h-3.5 w-3.5" /></button>
                    <button onClick={() => openDelete(customer)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 hover:shadow-md hover:shadow-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData?.length === 0 && <TableRow><TableCell colSpan={4} className="py-12 text-center text-slate-400">Không tìm thấy dữ liệu.</TableCell></TableRow>}
          </TableBody>
        </Table>

        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white/50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredData?.length || 0)}</span> trong <span className="font-semibold text-slate-800">{filteredData?.length}</span> khách hàng
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
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
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
