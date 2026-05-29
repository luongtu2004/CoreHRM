'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Building2, Edit, Trash2, Users, Loader2, Eye, UserCircle } from 'lucide-react';
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

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewDepartmentId, setViewDepartmentId] = useState<string | null>(null);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'ACTIVE' });

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsAddOpen(false);
      setFormData({ name: '', description: '', status: 'ACTIVE' });
      toast.success('Thêm phòng ban thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm phòng ban');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/departments/${selectedItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditOpen(false);
      toast.success('Cập nhật phòng ban thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật phòng ban');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsDeleteOpen(false);
      toast.success('Xóa phòng ban thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa phòng ban');
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
    setFormData({ name: item.name, description: item.description || '', status: item.status });
    setIsEditOpen(true);
  };

  const openDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const openView = (item: any) => {
    setViewDepartmentId(item.id);
    setIsViewOpen(true);
  };

  const { data: departmentDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['department', viewDepartmentId],
    queryFn: async () => {
      if (!viewDepartmentId) return null;
      const response = await api.get(`/departments/${viewDepartmentId}`);
      return response.data;
    },
    enabled: !!viewDepartmentId,
  });

  const filteredData = departments?.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil((filteredData?.length || 0) / PAGE_SIZE);
  const paginatedData = filteredData?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500/15';
  const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500/15 cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cơ cấu phòng ban</h1>
          <p className="text-gray-500">Quản lý sơ đồ tổ chức và các phòng ban trong công ty.</p>
        </div>
        <Button className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /><span>Thêm phòng ban</span>
        </Button>
      </div>

      <FormDrawer open={isViewOpen} onClose={() => setIsViewOpen(false)} title="Chi tiết phòng ban" subtitle={departmentDetails?.name || 'Đang tải...'} accentColor="amber">
        {isDetailsLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Thông tin chung</h3>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Mô tả:</span> {departmentDetails?.description || 'Không có'}</p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Trạng thái:</span> {departmentDetails?.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                Danh sách nhân viên <Badge variant="secondary" className="bg-slate-100 text-slate-600">{departmentDetails?.employees?.length || 0}</Badge>
              </h3>
              {departmentDetails?.employees?.length > 0 ? (
                <div className="space-y-3">
                  {departmentDetails.employees.map((emp: any) => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <UserCircle className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{emp.user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.user?.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-xs font-normal border-slate-200 text-slate-600">
                          {emp.position || 'Nhân viên'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-sm text-slate-500">Phòng ban này chưa có nhân viên nào.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </FormDrawer>

      <FormDrawer open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm phòng ban mới" subtitle="Tạo phòng ban mới trong công ty" accentColor="amber">
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên phòng ban</label>
            <input required type="text" placeholder="VD: Phòng Marketing" className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input type="text" placeholder="VD: Chịu trách nhiệm quảng cáo" className={inputCls} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tạo mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa phòng ban" subtitle={selectedItem?.name} accentColor="amber">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên phòng ban</label>
            <input required type="text" className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả</label>
            <input type="text" className={inputCls} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select className={selectCls} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
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
          <DialogHeader>
            <DialogTitle>Xóa phòng ban</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa phòng ban <strong>{selectedItem?.name}</strong>? Thao tác này không thể hoàn tác.</p>
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
            placeholder="Tìm kiếm phòng ban..."
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
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Phòng ban</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Mô tả</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Thành viên</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Đang tải...</TableCell></TableRow>
            ) : paginatedData?.map((dept: any) => (
              <TableRow key={dept.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-orange-500/20 ring-2 ring-white">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 transition-colors group-hover:text-orange-600">{dept.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs px-6 py-4 text-sm font-medium text-slate-500 truncate">
                  {dept.description || 'Không có mô tả'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center space-x-1.5 text-sm font-medium text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>{dept._count?.employees || 0} thành viên</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={dept.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-200/50 hover:bg-slate-500/20'}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dept.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    {dept.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => openView(dept)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200 hover:shadow-md hover:shadow-blue-100">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => openEdit(dept)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-200 hover:shadow-md hover:shadow-amber-100">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => openDelete(dept)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/50 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 hover:shadow-md hover:shadow-rose-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy phòng ban nào.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white/50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredData?.length || 0)}</span> trong <span className="font-semibold text-slate-800">{filteredData?.length}</span> phòng ban
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
                      ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/30'
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
