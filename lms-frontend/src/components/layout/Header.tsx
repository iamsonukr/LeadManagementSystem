'use client';

import { Bell, Search, ChevronDown, Calendar } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-[220px] right-0 h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20">
      {/* Left - Page title injected via children or route */}
      <div className="flex items-center gap-3">
        {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
          <Calendar size={14} className="text-gray-400" />
          <span>May 12 – May 18, 2024</span>
          <ChevronDown size={13} className="text-gray-400" />
        </div> */}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 w-48">
          <Search size={13} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400"
          />
        </div>

        {/* Notification bell */}
        <div className="relative cursor-pointer">
          {/* <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell size={16} className="text-gray-500" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">3</span> */}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">A</div>
          <span className="text-sm font-medium text-gray-700">Admin</span>
          <ChevronDown size={13} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}
