'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Settings, ChevronRight, Check, CheckCheck, CalendarDays, CheckSquare, Ticket as TicketIcon, Cpu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Bảng điều khiển',
  '/dashboard/users': 'Quản lý tài khoản',
  '/dashboard/roles': 'Vai trò & phân quyền',
  '/dashboard/departments': 'Phòng ban',
  '/dashboard/employees': 'Nhân viên',
  '/dashboard/customers': 'Khách hàng',
  '/dashboard/tasks': 'Công việc',
  '/dashboard/tickets': 'Phiếu hỗ trợ',
  '/dashboard/attendance': 'Chấm công',
  '/dashboard/leaves': 'Nghỉ phép',
  '/dashboard/payroll': 'Bảng lương',
  '/dashboard/reports': 'Báo cáo',
  '/dashboard/settings': 'Cài đặt',
};

const notifTypeIcon: Record<string, any> = {
  LEAVE: CalendarDays,
  TASK: CheckSquare,
  TICKET: TicketIcon,
  SYSTEM: Cpu,
};

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const label = routeLabels[pathname] || 'Hệ thống';

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
    : 'A';

  const { data: unreadData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => (await api.get('/notifications/unread-count')).data,
    refetchInterval: 30000, // poll every 30s
  });

  const { data: notifsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    enabled: showNotifs,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifs = Array.isArray(notifsData) ? notifsData : [];

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = (notif: any) => {
    if (!notif.isRead) markReadMutation.mutate(notif.id);
    if (notif.link) router.push(notif.link);
    setShowNotifs(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md">
      
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm font-medium text-slate-500">
        <span className="hover:text-slate-800 transition-colors cursor-pointer">Admin</span>
        <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />
        <span className="text-slate-800 font-bold">{label}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100"
            onClick={() => setShowNotifs(v => !v)}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">{unreadCount} mới</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Bell className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Không có thông báo nào</p>
                  </div>
                ) : notifs.map((notif: any) => {
                  const IconComp = notifTypeIcon[notif.type] ?? Bell;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${!notif.isRead ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <IconComp className={`h-4 w-4 ${!notif.isRead ? 'text-blue-600' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.content}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-slate-100 outline-none transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-blue-500/30">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'Admin'}</p>
              <p className="mt-0.5 text-xs text-slate-400 leading-none">{user?.email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-slate-100">
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Tài khoản của tôi
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-lg mx-1 cursor-pointer"
              onClick={() => router.push('/dashboard/settings')}
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-lg mx-1 cursor-pointer"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Cài đặt</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-lg mx-1 text-rose-600 hover:!text-rose-600 hover:!bg-rose-50 cursor-pointer"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
