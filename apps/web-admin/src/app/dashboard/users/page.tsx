'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import FormDrawer from '@/components/ui/FormDrawer';
import { toast } from 'sonner';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'ACTIVE'
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data; // Depending on interceptor, might just be response if we fixed it globally, but for users it was response.data initially
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', status: 'ACTIVE' });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/users/${selectedUser.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditOpen(false);
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteOpen(false);
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete user');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      status: formData.status
    });
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      status: user.status
    });
    setIsEditOpen(true);
  };

  const openDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil((filteredUsers?.length || 0) / PAGE_SIZE);
  const paginatedUsers = filteredUsers?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
          <p className="text-gray-500">Quản lý người dùng và phân quyền trong hệ thống.</p>
        </div>
        <Button
          className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Thêm tài khoản</span>
        </Button>
      </div>

      {/* Add Drawer */}
      <FormDrawer
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Thêm tài khoản mới"
        subtitle="Điền thông tin để tạo tài khoản mới"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Họ và tên</label>
            <input required type="text" placeholder="VD: Nguyễn Văn An" autoComplete="name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input required type="email" placeholder="VD: an.nguyen@company.com" autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
            <input required type="password" minLength={6} placeholder="Ít nhất 6 ký tự" autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Số điện thoại <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input type="text" placeholder="VD: 0987 654 321" autoComplete="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      {/* Edit Drawer */}
      <FormDrawer
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Sửa tài khoản"
        subtitle={selectedUser?.email}
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input disabled type="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-400 outline-none cursor-not-allowed"
              value={formData.email} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Họ và tên</label>
            <input required type="text" placeholder="VD: Nguyễn Văn An" autoComplete="name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Số điện thoại</label>
            <input type="text" placeholder="VD: 0987 654 321" autoComplete="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
              value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </FormDrawer>

      {/* Delete Confirm Dialog (keep as modal) */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tài khoản</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa tài khoản <strong>{selectedUser?.name}</strong>? Thao tác này không thể hoàn tác.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedUser.id)}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Tài khoản</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Đăng nhập cuối</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ngày tạo</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Đang tải...</TableCell></TableRow>
            ) : paginatedUsers?.map((user: any) => (
              <TableRow key={user.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-blue-500/20 ring-2 ring-white">
                      {user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0) || ''}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 transition-colors group-hover:text-blue-600">{user.name}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-200/50 hover:bg-slate-500/20'}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => openEdit(user)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-200 hover:shadow-md hover:shadow-amber-100">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => openDelete(user)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 hover:shadow-md hover:shadow-rose-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filteredUsers?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy tài khoản nào.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white/50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredUsers?.length || 0)}</span> trong <span className="font-semibold text-slate-800">{filteredUsers?.length}</span> tài khoản
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
