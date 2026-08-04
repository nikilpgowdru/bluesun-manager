import React from 'react';
import { Menu, Clock, Crown, Sparkles } from 'lucide-react';

export default function Navbar({ onMenuToggle, pageTitle }) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-20 bg-obsidian-950/95 border-b border-amber-500/20 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-amber-400 hover:text-amber-300 hover:bg-obsidian-900 rounded-xl lg:hidden border border-amber-500/30"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black tracking-tight font-heading uppercase flex items-center gap-2 gold-text-shimmer">
            {pageTitle}
          </h2>
          <p className="text-[11px] text-amber-400/90 font-bold tracking-widest uppercase flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> Haute Couture Luxury Atelier
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-obsidian-900 border border-amber-500/20 text-xs font-bold text-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentDate}</span>
        </div>

        {/* Currency System Badge */}
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl gold-badge text-xs font-black shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Rupees ₹ System Active</span>
        </div>

        {/* Brand User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-amber-500/20">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 text-obsidian-950 flex items-center justify-center font-black text-xs shadow-md ring-2 ring-amber-400/40">
            BS
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-black text-amber-100 leading-tight tracking-wide">Bluesun Brand Owner</div>
            <div className="text-[10px] text-amber-400/80 font-bold leading-none uppercase tracking-widest">Master Atelier</div>
          </div>
        </div>
      </div>
    </header>
  );
}
