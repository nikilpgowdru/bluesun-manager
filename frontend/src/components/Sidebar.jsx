import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Users, CreditCard, FileText, Shirt } from 'lucide-react';

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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">Bluesun Apparel</h1>
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase">Clothing ERP System</span>
              </div>
            </div>
          </div>

          {/* Apparel Factory Lines */}
          <div className="mx-4 mt-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-semibold mb-2">3 Apparel Factories</div>
            <div className="grid grid-cols-3 gap-1 text-center text-xs font-bold">
              <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Jeans</span>
              <span className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">Shirts</span>
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Formals</span>
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
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
          Bluesun ERP &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
