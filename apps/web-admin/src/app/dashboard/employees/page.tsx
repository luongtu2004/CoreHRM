'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Edit, Trash2, Building2, Briefcase, Calendar, Loader2 } from 'lucide-react';
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

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ userId: '', position: '', departmentId: '', startDate: '', salary: '', status: 'ACTIVE' });

  // Assume we need users and departments for the dropdowns
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });
  const { data: deptsData } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddOpen(false);
      setFormData({ userId: '', position: '', departmentId: '', startDate: '', salary: '', status: 'ACTIVE' });
      toast.success('Thêm nhân viên thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi thêm')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/employees/${selectedItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEditOpen(false);
      toast.success('Cập nhật nhân viên thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi cập nhật')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDeleteOpen(false);
      toast.success('Xóa nhân viên thành công');
    },
    onError: (error: any) => toast.error('Lỗi khi xóa')
  });

  const handleAddSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData); };
  const handleEditSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(formData); };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({ userId: item.userId, position: item.position || '', departmentId: item.departmentId || '', startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', salary: item.salary?.toString() || '', status: item.status });
    setIsEditOpen(true);
  };
  const openDelete = (item: any) => { setSelectedItem(item); setIsDeleteOpen(true); };

  const filteredData = employees?.filter((item: any) => {
    const matchesSearch = item.user?.name?.toLowerCase().includes(search.toLowerCase()) || item.employeeCode?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const safeUsers = Array.isArray(usersData) ? usersData : (Array.isArray(usersData?.data) ? usersData.data : []);
  const safeDepts = Array.isArray(deptsData) ? deptsData : (Array.isArray(deptsData?.data) ? deptsData.data : []);
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/15';
  const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/15 cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý nhân sự</h1>
          <p className="text-gray-500">Quản lý danh sách nhân viên và thông tin vị trí công tác.</p>
        </div>
        <Button className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /><span>Thêm nhân viên</span>
        </Button>
      </div>

      <FormDrawer open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm nhân viên mới" subtitle="Điền thông tin nhân viên" accentColor="rose">
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tài khoản User</label>
            <select required className={selectCls} value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})}>
              <option value="">-- Chọn User --</option>
              {safeUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Chức vụ</label>
            <input required type="text" placeholder="VD: Lập trình viên" className={inputCls} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phòng ban</label>
            <select required className={selectCls} value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
              <option value="">-- Chọn phòng ban --</option>
              {safeDepts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Ngày bắt đầu</label>
            <input required type="date" className={inputCls} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Lương cơ bản <span className="text-slate-400 font-normal">(VND)</span></label>
            <input type="number" placeholder="VD: 15000000" className={inputCls} value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Thêm mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa thông tin nhân viên" subtitle={selectedItem?.user?.name} accentColor="rose">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Chức vụ</label>
            <input required type="text" className={inputCls} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phòng ban</label>
            <select required className={selectCls} value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
              <option value="">-- Chọn phòng ban --</option>
              {safeDepts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select className={selectCls} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="ACTIVE">Đang làm việc</option>
              <option value="INACTIVE">Đã nghỉ việc</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Lương cơ bản <span className="text-slate-400 font-normal">(VND)</span></label>
            <input type="number" placeholder="Cập nhật mức lương" className={inputCls} value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
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
          <DialogHeader><DialogTitle>Xóa nhân viên</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa hồ sơ nhân viên <strong>{selectedItem?.user?.name}</strong>?</p></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedItem.id)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm nhân viên..." className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="INACTIVE">Đã nghỉ việc</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Nhân viên</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Chức vụ</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Phòng ban</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Đang tải...</TableCell></TableRow>
            ) : filteredData?.map((emp: any) => (
              <TableRow key={emp.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-xs font-bold text-white shadow-sm shadow-rose-500/20 ring-2 ring-white">
                      {emp.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 transition-colors group-hover:text-rose-600">{emp.user?.name}</span>
                      <span className="text-xs text-slate-400">{emp.employeeCode}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    <Briefcase className="mr-2 h-4 w-4 text-slate-400" />{emp.position}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    <Building2 className="mr-2 h-4 w-4 text-slate-400" />{emp.department?.name || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-200/50 hover:bg-slate-500/20'}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    {emp.status === 'ACTIVE' ? 'Đang làm' : 'Nghỉ'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus-within:opacity-100 sm:opacity-100 md:opacity-0 md:translate-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} className="h-10 w-10 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all"><Edit className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(emp)} className="h-10 w-10 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all"><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData?.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy dữ liệu.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
