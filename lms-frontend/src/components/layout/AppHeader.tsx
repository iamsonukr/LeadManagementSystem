'use client';

import { useState } from 'react';
import { Bell, Search, ChevronDown, Calendar, LogOut, User, Settings, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useRouter } from 'next/navigation';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <header className="fixed top-0 left-0 md:left-[220px] right-0 h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 z-20">
      <div className="flex items-center gap-2">
        <button 
          className="md:hidden p-1.5 -ml-1.5 mr-1 rounded-md text-gray-500 hover:bg-gray-100"
          onClick={() => dispatch(toggleSidebar())}
        >
          <Menu size={20} />
        </button>
        {/* Date range */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
        <Calendar size={14} className="text-gray-400" />
        <span>May 12 – May 18, 2024</span>
        <ChevronDown size={13} className="text-gray-400" />
      </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 w-48">
          <Search size={13} className="text-gray-400" />
          <input type="text" placeholder="Search..." className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400" />
        </div>

        {/* Bell */}
        <div className="relative cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell size={16} className="text-gray-500" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">3</span>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-700 leading-none">{user?.name ?? 'User'}</div>
              <div className="text-[10px] text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
            <ChevronDown size={13} className="hidden text-gray-400 sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/myprofile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <User size={14} className="text-gray-400" /> My Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} className="text-gray-400" /> Settings
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
