import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Users, CreditCard, FileText, Shirt, Sparkles } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Garment Inventory', path: '/goods', icon: Package },
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
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900/90 text-white flex flex-col justify-between border-r border-slate-800/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-500 rounded-xl text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white font-heading">
                  BLUESUN
                </h1>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1 mt-1 font-mono">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> APPAREL ERP v2.0
                </span>
              </div>
            </div>
          </div>

          {/* Apparel Factory Lines */}
          <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold">
              <span>Apparel Lines</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase tracking-wider">3 Active</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
              <span className="px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">👖 Jeans</span>
              <span className="px-2 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30">👔 Shirts</span>
              <span className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">🧥 Formals</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 px-3 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 text-indigo-400" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-semibold text-center tracking-wider">
          Bluesun ERP System &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
