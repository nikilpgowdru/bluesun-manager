import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import { getDashboardStats } from '../api';
import { Package, DollarSign, TrendingDown, TrendingUp, Bell, Calendar, Crown, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats(selectedMonth);
      setStats(res.data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFactoryBadge = (factoryName) => {
    switch (factoryName) {
      case 'Jeans':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">👖 Jeans</span>;
      case 'Shirts':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">👔 Shirts</span>;
      case 'Formals':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">🧥 Formals</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">{factoryName}</span>;
    }
  };

  const factoryColumns = [
    {
      header: 'Apparel Line',
      accessor: 'factory',
      render: (row) => getFactoryBadge(row.factory),
    },
    {
      header: 'Available Stock',
      accessor: 'available_stock',
      render: (row) => (
        <span className="font-extrabold text-white text-sm">
          {row.available_stock.toLocaleString()} <span className="text-xs text-amber-400 font-bold">PCS</span>
        </span>
      ),
    },
    {
      header: 'Gross Sales',
      accessor: 'sales',
      render: (row) => (
        <span className="font-bold text-emerald-400">
          ₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Line Expenses',
      accessor: 'expenses',
      render: (row) => (
        <span className="font-bold text-amber-400">
          ₹{row.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Profit',
      accessor: 'profit',
      render: (row) => (
        <span className={`font-black ${row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const recentGoodsColumns = [
    { 
      header: 'Apparel Type', 
      accessor: 'type',
      render: (row) => <span className="font-bold text-slate-200">{row.type}</span>
    },
    {
      header: 'Brand Collection',
      accessor: 'brand_name',
      render: (row) => (
        <span className="font-black text-amber-300 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" /> {row.brand_name}
        </span>
      )
    },
    {
      header: 'Factory',
      accessor: 'factory_name',
      render: (row) => getFactoryBadge(row.factory_name)
    },
    { header: 'Manufacture Date', accessor: 'manufacture_date' },
    {
      header: 'Available Inventory',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-black text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{row.available_pcs} PCS</span>
      )
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Atelier Dashboard">
      {/* Month Selector Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 atelier-card p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Brand Executive Summary
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Real-time apparel inventory & financial analytics for Jeans, Shirts, and Formals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Filter Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {months.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-amber-400/80 font-bold uppercase tracking-widest animate-pulse">
          Loading Atelier Fashion Metrics...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Garment Available Stock"
              value={`${stats.overall_available_stock.toLocaleString()} PCS`}
              icon={Package}
              subtitle="Active Garments Ready for Sale"
              color="indigo"
            />
            <StatCard
              title="Total Brand Revenue"
              value={`₹${stats.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="+0%"
              subtitle="Gross Fashion Sales"
              color="emerald"
            />
            <StatCard
              title="Manufacturing Expenses"
              value={`₹${stats.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              subtitle="Fabrics, Tailoring & Production"
              color="amber"
            />
            <StatCard
              title="Net Atelier Profit"
              value={`₹${stats.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              trend={stats.net_profit >= 0 ? "+Net Gain" : "-Deficit"}
              subtitle="Revenue Minus Expenses"
              color="gold"
            />
          </div>

          {/* Main Grid: Factory Summary & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Factory Summary Table (2 cols) */}
            <div className="lg:col-span-2 atelier-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-heading">Apparel Factory Lines</h3>
                  <p className="text-xs text-slate-400 font-semibold">Live inventory & profit metrics per apparel unit.</p>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 uppercase tracking-widest">3 Apparel Lines</span>
              </div>
              <Table
                columns={factoryColumns}
                data={stats.factory_summaries}
              />
            </div>

            {/* Notifications Box (1 col) */}
            <div className="atelier-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider font-heading">System Notifications</h3>
                    <p className="text-xs text-slate-400 font-semibold">Live Atelier Inventory Alerts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border text-xs ${
                        n.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : n.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                      }`}
                    >
                      <div className="font-black flex items-center justify-between mb-1.5">
                        <span>{n.title}</span>
                        <span className="text-[10px] opacity-75 font-mono">{n.date}</span>
                      </div>
                      <p className="opacity-90 leading-relaxed font-semibold">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Manufactured Batches */}
          <div className="atelier-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-heading">Recent Manufactured Collections</h3>
                <p className="text-xs text-slate-400 font-semibold">Latest production batches across Jeans, Shirts, and Formals.</p>
              </div>
              <button
                onClick={() => navigate('/goods')}
                className="text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest hover:underline"
              >
                View Complete Inventory &rarr;
              </button>
            </div>
            <Table
              columns={recentGoodsColumns}
              data={stats.recent_goods}
              onRowClick={(row) => navigate(`/goods/${row.id}`)}
              emptyMessage="No recent manufactured collections found"
            />
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
