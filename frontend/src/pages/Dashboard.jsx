import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import { getDashboardStats } from '../api';
import { Package, DollarSign, TrendingDown, TrendingUp, Bell, Calendar, Factory, AlertOctagon } from 'lucide-react';

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
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">👖 Jeans Line</span>;
      case 'Shirts':
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-teal-50 text-teal-700 border border-teal-200">👔 Shirts Line</span>;
      case 'Formals':
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-purple-50 text-purple-700 border border-purple-200">🧥 Formals Line</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-slate-100 text-slate-800 border border-slate-200">{factoryName}</span>;
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
        <span className="font-extrabold text-slate-900 text-sm">
          {row.available_stock.toLocaleString()} <span className="text-xs text-slate-500 font-bold">PCS</span>
        </span>
      ),
    },
    {
      header: 'Gross Sales',
      accessor: 'sales',
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          ₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Expenses',
      accessor: 'expenses',
      render: (row) => (
        <span className="font-bold text-amber-600 text-sm">
          ₹{row.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Profit',
      accessor: 'profit',
      render: (row) => (
        <span className={`font-extrabold text-sm ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const recentGoodsColumns = [
    { 
      header: 'Garment Type', 
      accessor: 'type',
      render: (row) => <span className="font-extrabold text-slate-900">{row.type}</span>
    },
    {
      header: 'Brand Name',
      accessor: 'brand_name',
      render: (row) => <span className="font-extrabold text-slate-900">{row.brand_name}</span>
    },
    {
      header: 'Factory Line',
      accessor: 'factory_name',
      render: (row) => getFactoryBadge(row.factory_name)
    },
    {
      header: 'Manufacture Date',
      accessor: 'manufacture_date',
      render: (row) => <span className="text-slate-700 font-bold text-xs">{row.manufacture_date}</span>
    },
    {
      header: 'Available',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-extrabold text-slate-900">
          {row.available_pcs} <span className="text-xs text-slate-500 font-bold">PCS</span>
        </span>
      )
    }
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04'];

  return (
    <Layout title="Executive Overview">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading uppercase">
            Performance Summary
          </h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Real-time analytics across Jeans, Shirts, Formals, and Chansandra lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            {months.map(m => (
              <option key={m} value={m} className="text-slate-900 font-bold bg-white">{m === 'All' ? 'All Months' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 font-extrabold tracking-wider animate-pulse">
          Loading Executive Analytics...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Garment Available Stock"
              value={`${stats.overall_available_stock.toLocaleString()} PCS`}
              icon={Package}
              subtitle="Active Units Ready for Sale"
              color="indigo"
            />
            <StatCard
              title="Total Rejected Pieces"
              value={`${(stats.overall_rejected_pcs || 0).toLocaleString()} PCS`}
              icon={AlertOctagon}
              subtitle="Quality Control Rejects"
              color="amber"
            />
            <StatCard
              title="Total Sales Revenue"
              value={`₹${stats.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="Gross Sales"
              subtitle={stats.chansandra_total > 0 ? `Includes ₹${stats.chansandra_total.toLocaleString('en-IN')} Chansandra` : "Total Gross Earnings"}
              color="emerald"
            />
            <StatCard
              title="Total Expenses"
              value={`₹${stats.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              subtitle="Fabrics & Production Costs"
              color="amber"
            />
            <StatCard
              title="Net Profit"
              value={`₹${stats.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              trend={stats.net_profit >= 0 ? "+Net Gain" : "-Deficit"}
              subtitle="Sales Minus Expenses"
              color="blue"
            />
          </div>

          {/* Main Grid: Factory Summary & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Factory Summary Table (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-heading">Factory Performance</h3>
                  <p className="text-xs text-slate-600 font-semibold">Live inventory & profit metrics per apparel line.</p>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 uppercase tracking-wider">3 Apparel Lines</span>
              </div>
              <Table
                columns={factoryColumns}
                data={stats.factory_summaries}
              />
            </div>

            {/* Notifications Box (1 col) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-heading">System Alerts</h3>
                    <p className="text-xs text-slate-600 font-semibold">Live ERP Alerts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border text-xs ${
                        n.type === 'warning'
                          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                          : n.type === 'success'
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                          : 'bg-blue-50/90 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="font-extrabold flex items-center justify-between mb-1 text-slate-900">
                        <span>{n.title}</span>
                        <span className="text-[10px] opacity-75 font-mono">{n.date}</span>
                      </div>
                      <p className="opacity-90 leading-relaxed font-semibold text-slate-800">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Manufactured Batches */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-heading">Recent Production Lots</h3>
                <p className="text-xs text-slate-600 font-semibold">Latest manufactured batches across Jeans, Shirts, and Formals.</p>
              </div>
              <button
                onClick={() => navigate('/goods')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 uppercase tracking-wider hover:underline"
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
