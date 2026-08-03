import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Users, CreditCard, FileText, Factory, Sparkles } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Goods', path: '/goods', icon: Package },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Account Holders', path: '/account-holders', icon: Users },
    { label: 'Expenses', path: '/expenses', icon: CreditCard },
    { label: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl text-white shadow-lg shadow-brand-500/20">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">Bluesun Manager</h1>
                <span className="text-[10px] font-semibold text-brand-400 tracking-wider uppercase">Factory ERP v1.0</span>
              </div>
            </div>
          </div>

          {/* Business Units Badge */}
          <div className="mx-4 mt-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Business Units
              </span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">3 Active</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Jeans</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">Shirts</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Formals</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 font-medium text-center">
          Bluesun Manufacturing ERP &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
