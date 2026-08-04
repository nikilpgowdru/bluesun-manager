import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Users, CreditCard, FileText, Crown, Sparkles } from 'lucide-react';

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
          className="fixed inset-0 z-40 bg-obsidian-950/90 backdrop-blur-md lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-obsidian-900 text-white flex flex-col justify-between border-r border-amber-500/20 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-amber-500/20 bg-obsidian-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 rounded-xl text-obsidian-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
                <Crown className="w-5 h-5 text-obsidian-950" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-widest leading-none gold-text-shimmer uppercase font-heading">
                  BLUESUN
                </h1>
                <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1 mt-1 font-brand">
                  <Sparkles className="w-3 h-3 text-amber-400" /> LUXURY ATELIER
                </span>
              </div>
            </div>
          </div>

          {/* Apparel Factory Lines */}
          <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-obsidian-950 border border-amber-500/20 shadow-inner">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-2.5 font-bold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Couture Lines
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-extrabold uppercase tracking-wider">3 Lines</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/30">
                👖 Jeans
              </div>
              <div className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/30">
                👔 Shirts
              </div>
              <div className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/30">
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
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-obsidian-950 shadow-lg shadow-amber-500/25 ring-1 ring-white/30'
                      : 'text-amber-200/70 hover:text-amber-300 hover:bg-amber-500/10 hover:border hover:border-amber-500/20'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-obsidian-950' : 'text-amber-400'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 text-[11px] text-amber-400/60 font-bold text-center tracking-widest uppercase font-mono">
          Bluesun Luxury ERP &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
