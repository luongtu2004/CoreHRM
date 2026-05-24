'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Shield, Edit, Trash2, Lock, Loader2, Eye } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import FormDrawer from '@/components/ui/FormDrawer';
import { toast } from 'sonner';

const translateAction = (action: string) => {
  const map: any = { create: 'Tạo', read: 'Xem', update: 'Sửa', delete: 'Xóa' };
  return map[action] || action;
};

const translateModule = (module: string) => {
  const map: any = {
    users: 'người dùng',
    roles: 'vai trò',
    departments: 'phòng ban',
    employees: 'nhân viên',
    customers: 'khách hàng',
    tasks: 'công việc',
    tickets: 'hỗ trợ',
  };
  return map[module] || module;
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    }
  });

  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/roles/permissions');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsAddOpen(false);
      setFormData({ name: '', description: '' });
      toast.success('Thêm vai trò thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm vai trò');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/roles/${selectedItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditOpen(false);
      toast.success('Cập nhật vai trò thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật vai trò');
    }
  });

  const assignPermMutation = useMutation({
    mutationFn: async (permissionIds: string[]) => await api.post(`/roles/${selectedItem.id}/permissions`, { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsPermOpen(false);
      toast.success('Cập nhật quyền thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDeleteOpen(false);
      toast.success('Xóa vai trò thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa vai trò');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({ name: item.name, description: item.description || '' });
    setIsEditOpen(true);
  };

  const openDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const openPermissions = (item: any) => {
    setSelectedItem(item);
    setSelectedPermissions(item.rolePermissions?.map((rp: any) => rp.permissionId) || []);
    setIsPermOpen(true);
  };

  const openView = (item: any) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignPermMutation.mutate(selectedPermissions);
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Group permissions by module
  const groupedPermissions = allPermissions?.reduce((acc: any, curr: any) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {});

  const filteredData = roles?.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil((filteredData?.length || 0) / PAGE_SIZE);
  const paginatedData = filteredData?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-500/15';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý phân quyền</h1>
          <p className="text-gray-500">Định nghĩa các vai trò và quyền hạn trong hệ thống.</p>
        </div>
        <Button className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /><span>Thêm vai trò</span>
        </Button>
      </div>

      <FormDrawer open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm vai trò mới" subtitle="Tạo vai trò và cấu hình quyền hạn" accentColor="purple">
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên vai trò</label>
            <input required type="text" placeholder="VD: Quản lý, Nhân viên..." className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input type="text" placeholder="VD: Có quyền truy cập quản lý nhân sự" className={inputCls} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tạo mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa vai trò" subtitle={selectedItem?.name} accentColor="purple">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên vai trò</label>
            <input required type="text" className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả</label>
            <input type="text" className={inputCls} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isPermOpen} onClose={() => setIsPermOpen(false)} title="Phân quyền" subtitle={`Cấu hình quyền hạn cho ${selectedItem?.name}`} accentColor="purple">
        <form onSubmit={handleAssignSubmit} className="space-y-6">
          <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
            {groupedPermissions && Object.keys(groupedPermissions).map(module => (
              <div key={module} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 capitalize mb-3 border-b border-slate-200 pb-2">{module}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {groupedPermissions[module].map((perm: any) => (
                    <label key={perm.id} className="flex items-center space-x-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{translateAction(perm.action)} {translateModule(perm.module)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsPermOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white" disabled={assignPermMutation.isPending}>
              {assignPermMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu quyền hạn
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isViewOpen} onClose={() => setIsViewOpen(false)} title="Chi tiết vai trò" subtitle={selectedItem?.name} accentColor="purple">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Thông tin chung</h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
              <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Tên vai trò:</span> <span className="font-medium">{selectedItem?.name}</span></p>
              <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Mô tả:</span> {selectedItem?.description || 'Không có'}</p>
              <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Ngày tạo:</span> {selectedItem && new Date(selectedItem.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              Quyền hạn <Badge variant="secondary" className="bg-slate-100 text-slate-600">{selectedItem?.rolePermissions?.length || 0}</Badge>
            </h3>
            {selectedItem?.rolePermissions?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedItem.rolePermissions.map((rp: any) => (
                  <Badge key={rp.permissionId} className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 font-medium">
                    {translateAction(rp.permission?.action)} {translateModule(rp.permission?.module)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">Vai trò này chưa được cấp quyền nào.</p>
              </div>
            )}
          </div>
        </div>
      </FormDrawer>

      {/* Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa vai trò</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa vai trò <strong>{selectedItem?.name}</strong>? Thao tác này không thể hoàn tác.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedItem.id)}>
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
            placeholder="Tìm kiếm vai trò..."
            className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Tên vai trò</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Mô tả</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Quyền hạn</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ngày tạo</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Loading...</TableCell></TableRow>
            ) : paginatedData?.map((role: any) => (
              <TableRow key={role.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-500/20 ring-2 ring-white">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">{role.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs px-6 py-4 text-sm font-medium text-slate-500">
                  {role.description || 'Không có mô tả'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {role.rolePermissions?.slice(0, 3).map((rp: any) => (
                      <Badge key={rp.permissionId} className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 font-medium hover:bg-slate-200">
                        {translateAction(rp.permission?.action)} {translateModule(rp.permission?.module)}
                      </Badge>
                    ))}
                    {role.rolePermissions?.length > 3 && (
                      <span className="text-xs font-medium text-slate-400 self-center">+{role.rolePermissions.length - 3} quyền khác</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm font-medium text-slate-500">
                  {new Date(role.createdAt).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus-within:opacity-100 sm:opacity-100 md:opacity-0 md:translate-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openView(role)} className="h-9 w-9 rounded-full text-slate-400 hover:bg-amber-50 hover:text-amber-600 hover:shadow-md transition-all" title="Xem chi tiết">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openPermissions(role)} className="h-9 w-9 rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md transition-all" title="Quản lý quyền">
                      <Lock className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(role)} className="h-9 w-9 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(role)} className="h-9 w-9 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy vai trò nào.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white/50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredData?.length || 0)}</span> trong <span className="font-semibold text-slate-800">{filteredData?.length}</span> phân quyền
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
                      ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
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
