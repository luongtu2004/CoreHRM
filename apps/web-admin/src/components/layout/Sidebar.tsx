'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Building2, 
  UserSquare2, 
  Contact2, 
  CheckSquare, 
  Ticket, 
  Clock,
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { CoreHRMLogo } from '@/components/ui/CoreHRMLogo';

const menuGroups = [
  {
    label: 'Tổng quan',
    items: [
      { icon: LayoutDashboard, label: 'Bảng điều khiển', href: '/dashboard' },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { icon: Users, label: 'Tài khoản', href: '/dashboard/users' },
      { icon: ShieldCheck, label: 'Phân quyền', href: '/dashboard/roles' },
    ]
  },
  {
    label: 'Nhân sự',
    items: [
      { icon: Building2, label: 'Phòng ban', href: '/dashboard/departments' },
      { icon: UserSquare2, label: 'Nhân viên', href: '/dashboard/employees' },
      { icon: Clock, label: 'Chấm công', href: '/dashboard/attendance' },
      { icon: CalendarDays, label: 'Nghỉ phép', href: '/dashboard/leaves' },
      { icon: DollarSign, label: 'Bảng lương', href: '/dashboard/payroll' },
    ]
  },
  {
    label: 'Kinh doanh',
    items: [
      { icon: Contact2, label: 'Khách hàng', href: '/dashboard/customers' },
      { icon: CheckSquare, label: 'Công việc', href: '/dashboard/tasks' },
      { icon: Ticket, label: 'Hỗ trợ (Ticket)', href: '/dashboard/tickets' },
    ]
  },
  {
    label: 'Phân tích',
    items: [
      { icon: BarChart3, label: 'Báo cáo', href: '/dashboard/reports' },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
    : '?';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200/80 bg-white shadow-[2px_0_20px_rgba(0,0,0,0.04)]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center px-6 py-5 border-b border-slate-100/80 justify-start">
          <CoreHRMLogo variant="horizontal" size="md" theme="dark" />
        </div>
        
        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon className={cn("mr-3 h-[18px] w-[18px] shrink-0 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          {/* Settings link */}
          <Link
            href="/dashboard/settings"
            className={cn(
              "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === '/dashboard/settings'
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Settings className={cn(
              "mr-3 h-[18px] w-[18px] shrink-0 transition-colors",
              pathname === '/dashboard/settings' ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            Cài đặt
            {pathname === '/dashboard/settings' && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />}
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="mr-3 h-[18px] w-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-red-400" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
