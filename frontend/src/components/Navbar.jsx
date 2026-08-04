import React from 'react';
import { Menu, Clock, Sparkles, Shirt } from 'lucide-react';

export default function Navbar({ onMenuToggle, pageTitle }) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-20 bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl lg:hidden border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight font-heading uppercase flex items-center gap-2">
            {pageTitle}
          </h2>
          <p className="text-[11px] text-amber-400/90 font-semibold tracking-widest uppercase">
            Haute Couture Apparel Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentDate}</span>
        </div>

        {/* Currency System Badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 text-amber-300 border border-amber-500/30 text-xs font-black shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Rupees ₹ System</span>
        </div>

        {/* Brand User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md ring-2 ring-white/10">
            BS
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-black text-white leading-tight tracking-wide">Bluesun Brand Admin</div>
            <div className="text-[10px] text-slate-400 font-semibold leading-none uppercase tracking-wider">Atelier Operations</div>
          </div>
        </div>
      </div>
    </header>
  );
}
