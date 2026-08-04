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
        return <span className="px-3 py-1 text-xs font-black rounded-lg gold-badge">👖 Jeans Line</span>;
      case 'Shirts':
        return <span className="px-3 py-1 text-xs font-black rounded-lg gold-badge">👔 Shirts Line</span>;
      case 'Formals':
        return <span className="px-3 py-1 text-xs font-black rounded-lg gold-badge">🧥 Formals Line</span>;
      default:
        return <span className="px-3 py-1 text-xs font-black rounded-lg gold-badge">{factoryName}</span>;
    }
  };

  const factoryColumns = [
    {
      header: 'Couture Line',
      accessor: 'factory',
      render: (row) => getFactoryBadge(row.factory),
    },
    {
      header: 'Available Inventory',
      accessor: 'available_stock',
      render: (row) => (
        <span className="font-black text-amber-100 text-sm">
          {row.available_stock.toLocaleString()} <span className="text-xs text-amber-400 font-extrabold">PCS</span>
        </span>
      ),
    },
    {
      header: 'Gross Sales',
      accessor: 'sales',
      render: (row) => (
        <span className="font-black text-emerald-400 text-sm">
          ₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Manufacturing Costs',
      accessor: 'expenses',
      render: (row) => (
        <span className="font-bold text-amber-400 text-sm">
          ₹{row.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Atelier Profit',
      accessor: 'profit',
      render: (row) => (
        <span className={`font-black text-sm ${row.profit >= 0 ? 'text-amber-300 gold-text-shimmer' : 'text-rose-400'}`}>
          ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const recentGoodsColumns = [
    { 
      header: 'Garment Type', 
      accessor: 'type',
      render: (row) => <span className="font-bold text-amber-100">{row.type}</span>
    },
    {
      header: 'Brand Collection',
      accessor: 'brand_name',
      render: (row) => (
        <span className="font-black text-amber-400 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" /> {row.brand_name}
        </span>
      )
    },
    {
      header: 'Couture Line',
      accessor: 'factory_name',
      render: (row) => getFactoryBadge(row.factory_name)
    },
    { header: 'Manufacture Date', accessor: 'manufacture_date' },
    {
      header: 'Available PCS',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-black text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">{row.available_pcs} PCS</span>
      )
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Atelier Executive Dashboard">
      {/* Month Selector Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 gold-card p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-black tracking-wider uppercase font-heading flex items-center gap-2 gold-text-shimmer">
            <Crown className="w-5 h-5 text-amber-400" /> Executive Financial Overview
          </h2>
          <p className="text-xs text-amber-200/70 font-semibold mt-1">Real-time luxury apparel inventory, gross sales, and profit metrics in Rupees (₹).</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-300 uppercase tracking-widest">Filter Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-xl border border-amber-500/30 bg-obsidian-950 font-bold text-xs text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {months.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-amber-400 font-bold uppercase tracking-widest animate-pulse">
          Loading Luxury Atelier Metrics...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Available Garments"
              value={`${stats.overall_available_stock.toLocaleString()} PCS`}
              icon={Package}
              subtitle="Active Garments Ready for Sale"
            />
            <StatCard
              title="Total Brand Revenue"
              value={`₹${stats.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="Gross Sales"
              subtitle="Total Fashion Sales"
            />
            <StatCard
              title="Manufacturing Costs"
              value={`₹${stats.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              subtitle="Fabrics, Tailoring & Production"
            />
            <StatCard
              title="Net Atelier Profit"
              value={`₹${stats.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              trend={stats.net_profit >= 0 ? "+Net Gain" : "-Deficit"}
              subtitle="Revenue Minus Costs"
            />
          </div>

          {/* Main Grid: Factory Summary & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Factory Summary Table (2 cols) */}
            <div className="lg:col-span-2 gold-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider font-heading gold-text-shimmer">Couture Line Performance</h3>
                  <p className="text-xs text-amber-200/70 font-semibold">Live inventory & profit metrics across Jeans, Shirts, and Formals.</p>
                </div>
                <span className="text-xs font-black px-3 py-1 gold-badge rounded-full uppercase tracking-widest">3 Lines Active</span>
              </div>
              <Table
                columns={factoryColumns}
                data={stats.factory_summaries}
              />
            </div>

            {/* Notifications Box (1 col) */}
            <div className="gold-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-200 uppercase tracking-wider font-heading">System Alerts</h3>
                    <p className="text-xs text-amber-400/70 font-semibold">Live Atelier Inventory Alerts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100 text-xs shadow-inner"
                    >
                      <div className="font-black flex items-center justify-between mb-1.5 text-amber-300">
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
          <div className="gold-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider font-heading gold-text-shimmer">Recent Manufactured Collections</h3>
                <p className="text-xs text-amber-200/70 font-semibold">Latest production batches across Jeans, Shirts, and Formals.</p>
              </div>
              <button
                onClick={() => navigate('/goods')}
                className="text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> View Inventory &rarr;
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
