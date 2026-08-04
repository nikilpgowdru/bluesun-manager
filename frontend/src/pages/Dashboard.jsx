import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import { getDashboardStats } from '../api';
import { Package, DollarSign, TrendingDown, TrendingUp, Bell, Calendar, Sparkles } from 'lucide-react';

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
        return <span className="px-3 py-1 text-xs font-bold rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">👖 Jeans Line</span>;
      case 'Shirts':
        return <span className="px-3 py-1 text-xs font-bold rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30">👔 Shirts Line</span>;
      case 'Formals':
        return <span className="px-3 py-1 text-xs font-bold rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">🧥 Formals Line</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 border border-slate-700">{factoryName}</span>;
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
          {row.available_stock.toLocaleString()} <span className="text-xs text-indigo-400 font-semibold">PCS</span>
        </span>
      ),
    },
    {
      header: 'Gross Sales',
      accessor: 'sales',
      render: (row) => (
        <span className="font-bold text-emerald-400 text-sm">
          ₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Line Expenses',
      accessor: 'expenses',
      render: (row) => (
        <span className="font-bold text-amber-400 text-sm">
          ₹{row.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Profit',
      accessor: 'profit',
      render: (row) => (
        <span className={`font-black text-sm ${row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const recentGoodsColumns = [
    { 
      header: 'Garment Type', 
      accessor: 'type',
      render: (row) => <span className="font-bold text-slate-200">{row.type}</span>
    },
    {
      header: 'Brand Name',
      accessor: 'brand_name',
      render: (row) => (
        <span className="font-extrabold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {row.brand_name}
        </span>
      )
    },
    {
      header: 'Factory Line',
      accessor: 'factory_name',
      render: (row) => getFactoryBadge(row.factory_name)
    },
    { header: 'Manufacture Date', accessor: 'manufacture_date' },
    {
      header: 'Available Inventory',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-extrabold text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-xl border border-indigo-500/30">{row.available_pcs} PCS</span>
      )
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Dashboard Overview">
      {/* Month Selector Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pro-card p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Executive Analytics
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time apparel inventory & financial performance across Jeans, Shirts, and Formals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-indigo-400 font-bold tracking-wider animate-pulse">
          Loading Analytics...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Garment Available Stock"
              value={`${stats.overall_available_stock.toLocaleString()} PCS`}
              icon={Package}
              subtitle="Active Units Ready for Sale"
              color="indigo"
            />
            <StatCard
              title="Total Sales Revenue"
              value={`₹${stats.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="Gross Sales"
              subtitle="Total Gross Earnings"
              color="emerald"
            />
            <StatCard
              title="Total Expenses"
              value={`₹${stats.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              subtitle="Fabrics, Tailoring & Production"
              color="amber"
            />
            <StatCard
              title="Net Profit"
              value={`₹${stats.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              trend={stats.net_profit >= 0 ? "+Net Gain" : "-Deficit"}
              subtitle="Sales Minus Expenses"
              color="purple"
            />
          </div>

          {/* Main Grid: Factory Summary & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Factory Summary Table (2 cols) */}
            <div className="lg:col-span-2 pro-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">Factory Performance</h3>
                  <p className="text-xs text-slate-400">Live inventory & profit metrics per apparel line.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20 uppercase tracking-wider">3 Apparel Lines</span>
              </div>
              <Table
                columns={factoryColumns}
                data={stats.factory_summaries}
              />
            </div>

            {/* Notifications Box (1 col) */}
            <div className="pro-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">System Alerts</h3>
                    <p className="text-xs text-slate-400 font-semibold">Live ERP Alerts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-slate-200 text-xs shadow-inner"
                    >
                      <div className="font-bold flex items-center justify-between mb-1.5 text-indigo-300">
                        <span>{n.title}</span>
                        <span className="text-[10px] opacity-75 font-mono">{n.date}</span>
                      </div>
                      <p className="opacity-90 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Manufactured Batches */}
          <div className="pro-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">Recent Production Lots</h3>
                <p className="text-xs text-slate-400 font-semibold">Latest manufactured batches across Jeans, Shirts, and Formals.</p>
              </div>
              <button
                onClick={() => navigate('/goods')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider hover:underline"
              >
                View Inventory &rarr;
              </button>
            </div>
            <Table
              columns={recentGoodsColumns}
              data={stats.recent_goods}
              onRowClick={(row) => navigate(`/goods/${row.id}`)}
              emptyMessage="No recent goods recorded"
            />
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
