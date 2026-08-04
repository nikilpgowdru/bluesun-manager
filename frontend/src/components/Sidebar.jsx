import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Users, CreditCard, FileText, Crown, Scissors, Shirt, Sparkles } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Garment Inventory', path: '/goods', icon: Package },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Account Holders', path: '/account-holders', icon: Users },
    { label: 'Brand Expenses', path: '/expenses', icon: CreditCard },
    { label: 'Atelier Reports', path: '/reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-950 text-white flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800/80 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-widest leading-none text-white uppercase font-heading">
                  BLUESUN
                </h1>
                <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1 mt-1 font-brand">
                  <Scissors className="w-3 h-3 text-amber-400" /> ATELIER & APPAREL
                </span>
              </div>
            </div>
          </div>

          {/* Apparel Factory Lines */}
          <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 font-semibold">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Apparel Lines
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">3 Factories</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="px-2 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1">
                👖 Jeans
              </div>
              <div className="px-2 py-1 text-[11px] font-bold rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1">
                👔 Shirts
              </div>
              <div className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-1">
                🧥 Formals
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-3 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`
                }
              >
                <item.icon className="w-4 h-4 text-amber-400/90" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-semibold text-center tracking-wider uppercase">
          Bluesun Apparel ERP &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
