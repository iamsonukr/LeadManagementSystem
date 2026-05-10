'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CheckSquare,
  Phone, BarChart2, UserCog, Settings, CalendarClock, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setSidebarOpen, toggleSidebar } from '@/store/slices/uiSlice';
import { useAuth } from '@/context/AuthContext';
import { canAccessPath } from '@/lib/rbac';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/followups', label: 'Follow Ups', icon: CalendarClock },
  // { href: '/contacts', label: 'Contacts', icon: UserCircle },
  // { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/calls', label: 'Call Logs', icon: Phone },
  { href: '/projects', label: 'Projects', icon: CheckSquare },
  // { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/team', label: 'Departments', icon: UserCog },
  { href: '/users', label: 'Users', icon: UserCog },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const { user } = useAuth();

  useEffect(() => {
    const syncSidebarForViewport = () => {
      dispatch(setSidebarOpen(window.innerWidth >= 768));
    };

    syncSidebarForViewport();
    window.addEventListener('resize', syncSidebarForViewport);
    return () => window.removeEventListener('resize', syncSidebarForViewport);
  }, [dispatch]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden" 
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-100 flex flex-col z-30 transition-transform duration-300 md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">LMS</div>
          <div className="text-[10px] text-gray-400 ">Lead Management System</div>
        </div>
          </div>
          <button 
            className="md:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => dispatch(toggleSidebar())}
          >
            <X size={18} />
          </button>
        </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navItems.filter((item) => canAccessPath(user, item.href)).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              onClick={() => {
                if (window.innerWidth < 768) {
                  dispatch(toggleSidebar());
                }
              }}
            >
              <Icon size={17} className={active ? 'text-indigo-600' : 'text-gray-400'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Today&apos;s Follow Ups */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <BarChart2 size={14} className="text-indigo-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Today&apos;s Follow Ups</span>
        </div>
        <div className="text-2xl font-bold text-indigo-700 pl-1">8</div>
        <Link href="/calls" className="text-xs text-indigo-500 hover:text-indigo-700 pl-1">View All</Link>
      </div>
    </aside>
    </>
  );
}
