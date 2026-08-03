import React from 'react';
import { Menu, Building2, Clock, CheckCircle2 } from 'lucide-react';

export default function Navbar({ onMenuToggle, pageTitle }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 text-xs font-semibold text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* System Health Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">System Live</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            BS
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Admin User</div>
            <div className="text-[10px] text-slate-500 font-medium leading-none">Bluesun ERP</div>
          </div>
        </div>
      </div>
    </header>
  );
}
