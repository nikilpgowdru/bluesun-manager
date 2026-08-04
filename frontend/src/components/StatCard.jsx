import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, subtitle, color = "indigo" }) {
  const colorStyles = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="pro-card rounded-2xl p-6 relative overflow-hidden group">
      {/* Background Ambient Glow */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all duration-500" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">{title}</span>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorStyles[color] || colorStyles.indigo} shadow-lg ring-1 ring-white/10`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <div className="text-3xl font-extrabold text-white tracking-tight font-heading">{value}</div>
        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-slate-400">
            {trend && <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{trend}</span>}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
