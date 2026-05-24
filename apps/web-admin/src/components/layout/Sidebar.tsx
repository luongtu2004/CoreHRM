'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, ShieldCheck, Building2, UserSquare2, 
  Contact2, CheckSquare, Ticket, Clock, BarChart3, Settings,
  LogOut, ChevronRight, CalendarDays, DollarSign, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useDensity } from '@/hooks/useDensity';
import { CoreHRMLogo } from '@/components/ui/CoreHRMLogo';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const { density, setDensity } = useDensity();

  const collapsed = density === 'compact';

  const menuGroups = [
    {
      label: t('nav.overview'),
      items: [{ icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' }]
    },
    {
      label: t('nav.system'),
      items: [
        { icon: Users, label: t('nav.users'), href: '/dashboard/users' },
        { icon: ShieldCheck, label: t('nav.roles'), href: '/dashboard/roles' },
      ]
    },
    {
      label: t('nav.hr'),
      items: [
        { icon: Building2, label: t('nav.departments'), href: '/dashboard/departments' },
        { icon: UserSquare2, label: t('nav.employees'), href: '/dashboard/employees' },
        { icon: Clock, label: t('nav.attendance'), href: '/dashboard/attendance' },
        { icon: CalendarDays, label: t('nav.leaves'), href: '/dashboard/leaves' },
        { icon: DollarSign, label: t('nav.payroll'), href: '/dashboard/payroll' },
      ]
    },
    {
      label: t('nav.business'),
      items: [
        { icon: Contact2, label: t('nav.customers'), href: '/dashboard/customers' },
        { icon: CheckSquare, label: t('nav.tasks'), href: '/dashboard/tasks' },
        { icon: Ticket, label: t('nav.tickets'), href: '/dashboard/tickets' },
      ]
    },
    {
      label: t('nav.analytics'),
      items: [{ icon: BarChart3, label: t('nav.reports'), href: '/dashboard/reports' }]
    },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
    : '?';

  const navItemCls = (isActive: boolean) => cn(
    'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
    collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5',
    isActive
      ? 'bg-blue-50 text-blue-600 shadow-sm'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  );

  const iconCls = (isActive: boolean) => cn(
    'shrink-0 transition-colors',
    collapsed ? 'h-[18px] w-[18px]' : 'mr-3 h-[18px] w-[18px]',
    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
  );

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200/80 bg-white shadow-[2px_0_20px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out',
      collapsed ? 'w-[64px]' : 'w-64'
    )}>

      {/* ── Logo + Toggle button ── */}
      <div className={cn(
        'flex h-16 shrink-0 items-center border-b border-slate-100/80 gap-2',
        collapsed ? 'justify-between px-2' : 'px-4'
      )}>
        {collapsed
          ? <CoreHRMLogo variant="emblem" size="sm" theme="dark" />
          : <div className="flex-1 min-w-0"><CoreHRMLogo variant="horizontal" size="md" theme="dark" /></div>
        }
        <button
          onClick={() => setDensity(collapsed ? 'comfortable' : 'compact')}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-600"
        >
          {collapsed
            ? <ChevronsRight className="h-4 w-4" />
            : <ChevronsLeft className="h-4 w-4" />
          }
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-3 px-2">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed
              ? <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
              : <div className="my-1.5 border-t border-slate-100" />
            }
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={navItemCls(isActive)}
                  >
                    <item.icon className={iconCls(isActive)} />
                    {!collapsed && (
                      <>
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="shrink-0 border-t border-slate-100 px-2 py-3 space-y-1">

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          title={collapsed ? t('nav.settings') : undefined}
          className={navItemCls(pathname === '/dashboard/settings')}
        >
          <Settings className={iconCls(pathname === '/dashboard/settings')} />
          {!collapsed && (
            <>
              {t('nav.settings')}
              {pathname === '/dashboard/settings' && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />}
            </>
          )}
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          title={collapsed ? t('nav.logout') : undefined}
          className={cn(
            'group flex w-full items-center rounded-xl text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-500',
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5'
          )}
        >
          <LogOut className={cn(
            'shrink-0 transition-colors group-hover:text-red-400',
            collapsed ? 'h-[18px] w-[18px] text-slate-400' : 'mr-3 h-[18px] w-[18px] text-slate-400'
          )} />
          {!collapsed && t('nav.logout')}
        </button>

      </div>
    </aside>
  );
}
