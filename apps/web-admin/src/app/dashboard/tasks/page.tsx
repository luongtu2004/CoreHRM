'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Edit, Trash2, Calendar, User, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import FormDrawer from '@/components/ui/FormDrawer';
import { toast } from 'sonner';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assignedTo: '', dueDate: '' });

  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });

  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data
  });
  const dataList = Array.isArray(tasksResponse?.data) ? tasksResponse.data : (Array.isArray(tasksResponse) ? tasksResponse : []);

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAddOpen(false);
      setFormData({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assignedTo: '', dueDate: '' });
      toast.success('Thêm công việc thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi thêm')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => await api.patch(`/tasks/${selectedItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsEditOpen(false);
      toast.success('Cập nhật thành công');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Lỗi khi cập nhật')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDeleteOpen(false);
      toast.success('Xóa thành công');
    },
    onError: (error: any) => toast.error('Lỗi khi xóa')
  });

  const handleAddSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData); };
  const handleEditSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(formData); };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({ title: item.title, description: item.description || '', priority: item.priority, status: item.status, assignedTo: item.assignedTo || '', dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '' });
    setIsEditOpen(true);
  };
  const openDelete = (item: any) => { setSelectedItem(item); setIsDeleteOpen(true); };

  const filteredData = dataList.filter((item: any) => {
    const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      case 'DONE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dot-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-600 border-blue-200/50 dot-blue-500';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-600 border-slate-200/50 dot-slate-500';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-200/50 dot-amber-500';
    }
  };

  const safeUsers = Array.isArray(usersData) ? usersData : (Array.isArray(usersData?.data) ? usersData.data : []);
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-fuchsia-400 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/15';
  const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-fuchsia-400 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/15 cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý công việc</h1>
          <p className="text-gray-500">Tổ chức và theo dõi các nhiệm vụ trong công ty.</p>
        </div>
        <Button className="flex items-center space-x-2 rounded-full px-5 shadow-sm hover:shadow-md transition-all" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /><span>Công việc mới</span>
        </Button>
      </div>

      <FormDrawer open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm công việc mới" subtitle="Điền thông tin nhiệm vụ" accentColor="purple">
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
            <input required type="text" placeholder="VD: Báo cáo quý" className={inputCls} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input type="text" placeholder="Chi tiết công việc..." className={inputCls} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
              <label className="text-sm font-semibold text-slate-700">Hạn chờ</label>
              <input type="date" className={inputCls} value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Người phụ trách</label>
            <select required className={selectCls} value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
              <option value="">-- Chọn --</option>
              {safeUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tạo mới
            </Button>
          </div>
        </form>
      </FormDrawer>

      <FormDrawer open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa công việc" subtitle={selectedItem?.title} accentColor="purple">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
            <input required type="text" className={inputCls} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select className={selectCls} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="TODO">Cần làm</option>
              <option value="IN_PROGRESS">Đang làm</option>
              <option value="DONE">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
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
          <DialogHeader><DialogTitle>Xóa công việc</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa công việc này?</p></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedItem.id)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm công việc..." className="ml-3 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all hover:bg-slate-50 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="TODO">Cần làm</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="DONE">Hoàn thành</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Công việc</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Mức độ</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Trạng thái</TableHead>
              <TableHead className="h-14 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Hạn chót</TableHead>
              <TableHead className="h-14 px-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400">Đang tải...</TableCell></TableRow>
            ) : filteredData?.map((task: any) => (
              <TableRow key={task.id} className="group border-b border-slate-50 transition-all duration-300 hover:bg-slate-50/80">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-xs font-bold text-white shadow-sm shadow-fuchsia-500/20 ring-2 ring-white">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-semibold text-slate-800 transition-colors group-hover:text-fuchsia-600 max-w-[200px] truncate">{task.title}</span>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <User className="h-3 w-3" /><span>{task.assignedUser?.name || 'Chưa giao'}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={getPriorityBadge(task.priority).replace('dot-', '')}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getPriorityBadge(task.priority).match(/dot-([a-z-0-9]+)/)?.[1] || 'bg-slate-400'}`}></div>
                    {task.priority === 'URGENT' ? 'Khẩn cấp' : task.priority === 'HIGH' ? 'Cao' : task.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={getStatusBadge(task.status).replace('dot-', '')}>
                    <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getStatusBadge(task.status).match(/dot-([a-z-0-9]+)/)?.[1] || 'bg-slate-400'}`}></div>
                    {task.status === 'DONE' ? 'Hoàn thành' : task.status === 'IN_PROGRESS' ? 'Đang làm' : task.status === 'CANCELLED' ? 'Đã hủy' : 'Cần làm'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus-within:opacity-100 sm:opacity-100 md:opacity-0 md:translate-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(task)} className="h-10 w-10 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all"><Edit className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(task)} className="h-10 w-10 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all"><Trash2 className="h-5 w-5" /></Button>
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
