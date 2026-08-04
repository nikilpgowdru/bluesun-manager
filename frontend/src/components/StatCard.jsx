import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, subtitle, color = "indigo" }) {
  const colorStyles = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    gold: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  };

  return (
    <div className="atelier-card rounded-2xl p-6 border border-slate-800 transition-all duration-300 relative overflow-hidden group">
      {/* Background Ambient Glow */}
      <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 font-heading">{title}</span>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorStyles[color] || colorStyles.indigo} shadow-lg ring-1 ring-white/10`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-5 relative z-10">
        <div className="text-3xl font-black text-white tracking-tight font-heading">{value}</div>
        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
            {trend && <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{trend}</span>}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
