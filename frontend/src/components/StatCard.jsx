import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, subtitle }) {
  return (
    <div className="gold-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group">
      {/* Background Ambient Gold Glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 font-heading">{title}</span>
        {Icon && (
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-lg ring-1 ring-amber-400/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-5 relative z-10">
        <div className="text-3xl font-black text-white tracking-tight font-heading gold-text-shimmer">{value}</div>
        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-amber-200/70">
            {trend && <span className="text-obsidian-950 font-black bg-amber-400 px-2 py-0.5 rounded shadow-sm">{trend}</span>}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
