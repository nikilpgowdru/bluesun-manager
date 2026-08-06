import React, { useState } from 'react';
import { Menu, Clock, Sparkles, ShieldCheck, Database } from 'lucide-react';
import { seedDatabase } from '../api';

export default function Navbar({ onMenuToggle, pageTitle }) {
  const [loadingSeed, setLoadingSeed] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleRestoreDemoData = async () => {
    if (window.confirm('Restore all default sample data (Jeans, Shirts, Formals, Sales, Account Balances)?')) {
      try {
        setLoadingSeed(true);
        await seedDatabase();
        window.location.reload();
      } catch (err) {
        alert('Failed to restore data: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoadingSeed(false);
      }
    }
  };

  return (
    <header className="h-20 bg-[#07090e]/80 border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl lg:hidden border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-heading flex items-center gap-2">
            {pageTitle}
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold tracking-wider">
            Clothing Factory & Enterprise Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Restore Data Button */}
        <button
          onClick={handleRestoreDemoData}
          disabled={loadingSeed}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all border border-indigo-500/40"
          title="Click to restore all default sample data"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{loadingSeed ? 'Restoring...' : 'Restore All Data'}</span>
        </button>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentDate}</span>
        </div>

        {/* Currency System Badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Rupees ₹ System Active</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white/10">
            BS
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-white leading-tight">Admin User</div>
            <div className="text-[10px] text-slate-400 font-medium leading-none">Bluesun ERP</div>
          </div>
        </div>
      </div>
    </header>
  );
}
