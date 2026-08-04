import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import { getDashboardStats } from '../api';
import { Package, DollarSign, TrendingDown, TrendingUp, Bell, Calendar, Factory } from 'lucide-react';

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

  const factoryColumns = [
    {
      header: 'Factory',
      accessor: 'factory',
      render: (row) => (
        <span className="flex items-center gap-2 font-bold text-slate-800">
          <Factory className="w-4 h-4 text-blue-600" />
          {row.factory}
        </span>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'available_stock',
      render: (row) => (
        <span className="font-extrabold text-slate-900">
          {row.available_stock.toLocaleString()} <span className="text-xs text-slate-400 font-normal">PCS</span>
        </span>
      ),
    },
    {
      header: 'Sales',
      accessor: 'sales',
      render: (row) => (
        <span className="font-bold text-emerald-600">
          ₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Expenses',
      accessor: 'expenses',
      render: (row) => (
        <span className="font-bold text-amber-600">
          ₹{row.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Profit',
      accessor: 'profit',
      render: (row) => (
        <span className={`font-extrabold ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const recentGoodsColumns = [
    { header: 'Type', accessor: 'type' },
    {
      header: 'Brand Name',
      accessor: 'brand_name',
      render: (row) => <span className="font-bold text-slate-800">{row.brand_name}</span>
    },
    {
      header: 'Factory',
      accessor: 'factory_name',
      render: (row) => (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
          {row.factory_name}
        </span>
      )
    },
    { header: 'Date', accessor: 'manufacture_date' },
    {
      header: 'Available PCS',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-bold text-blue-700">{row.available_pcs} PCS</span>
      )
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Dashboard">
      {/* Month Selector Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Executive Summary</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time database performance metrics across Jeans, Shirts, and Formals factories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading factory metrics...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Overall Available Stock"
              value={`${stats.overall_available_stock.toLocaleString()} PCS`}
              icon={Package}
              subtitle="Active Units Ready for Sale"
              color="indigo"
            />
            <StatCard
              title="Total Sales"
              value={`₹${stats.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="+0%"
              subtitle="Total Gross Earnings"
              color="emerald"
            />
            <StatCard
              title="Total Expenses"
              value={`₹${stats.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              subtitle="Raw Materials & Factory Costs"
              color="amber"
            />
            <StatCard
              title="Net Profit"
              value={`₹${stats.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              trend={stats.net_profit >= 0 ? "+Net Gain" : "-Deficit"}
              subtitle="Sales Minus Expenses"
              color={stats.net_profit >= 0 ? "blue" : "sky"}
            />
          </div>

          {/* Main Grid: Factory Summary & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Factory Summary Table (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Factory Summary</h3>
                  <p className="text-xs text-slate-500">Automated performance metrics per factory unit.</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">3 Factories</span>
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
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">System Notifications</h3>
                    <p className="text-xs text-slate-500">Automated ERP Alerts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        n.type === 'warning'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : n.type === 'success'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-blue-50/70 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between mb-1">
                        <span>{n.title}</span>
                        <span className="text-[10px] opacity-75">{n.date}</span>
                      </div>
                      <p className="opacity-90 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Goods Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Recent Goods</h3>
                <p className="text-xs text-slate-500">Latest manufactured production lots across factories.</p>
              </div>
              <button
                onClick={() => navigate('/goods')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View Production History &rarr;
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
