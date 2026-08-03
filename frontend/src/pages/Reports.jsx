import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import { getReports } from '../api';
import { Printer, Calendar, Filter, Factory, Download, Package, DollarSign, TrendingDown, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState('All');
  const [factory, setFactory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [month, factory]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getReports(month, factory);
      setReport(res.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const factoryColumns = [
    {
      header: 'Factory',
      accessor: 'factory',
      render: (row) => <span className="font-extrabold text-slate-800">{row.factory}</span>,
    },
    {
      header: 'Available Stock',
      accessor: 'available_stock',
      render: (row) => <span>{row.available_stock.toLocaleString()} PCS</span>,
    },
    {
      header: 'Sales (₹)',
      accessor: 'sales',
      render: (row) => <span className="font-bold text-emerald-600">₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'Expenses (₹)',
      accessor: 'expenses',
      render: (row) => <span className="font-bold text-amber-600">₹{row.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'Net Profit (₹)',
      accessor: 'profit',
      render: (row) => (
        <span className={`font-extrabold ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const topGoodsColumns = [
    { header: 'Type', accessor: 'type' },
    { header: 'Brand Name', accessor: 'brand_name' },
    { header: 'Factory', accessor: 'factory_name' },
    { header: 'Sold PCS', accessor: 'sold_pcs' },
    {
      header: 'Total Revenue',
      accessor: 'total_earnings',
      render: (row) => <span className="font-extrabold text-emerald-600">₹{row.total_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Executive Reports">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {months.map(m => (
                <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
              ))}
            </select>
          </div>

          {/* Factory Selector */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Factory:</span>
            <select
              value={factory}
              onChange={(e) => setFactory(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Factories</option>
              <option value="Jeans">Jeans</option>
              <option value="Shirts">Shirts</option>
              <option value="Formals">Formals</option>
            </select>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs tracking-wide shadow-md shadow-brand-600/20 hover:bg-brand-700 transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Official Report
        </button>
      </div>

      {/* Printable Report Container */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Generating printable executive report...
        </div>
      ) : report ? (
        <div className="print-container bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs space-y-8">
          {/* Printable Report Header */}
          <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xl tracking-tight mb-1">
                <Factory className="w-6 h-6" />
                <span>Bluesun Manager</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Production Report</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Factory Unit: <strong className="text-slate-800">{report.factory}</strong> | Period: <strong className="text-slate-800">{report.month}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Official Certified
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-2">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Core Performance Overview</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Available Stock</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{report.available_stock.toLocaleString()} PCS</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700 uppercase">Total Sales</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                  ₹{report.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-xs font-bold text-amber-700 uppercase">Total Expenses</span>
                <p className="text-2xl font-extrabold text-amber-700 mt-1">
                  ₹{report.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100">
                <span className="text-xs font-bold text-brand-700 uppercase">Net Profit</span>
                <p className={`text-2xl font-extrabold mt-1 ${report.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  ₹{report.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Factory Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Factory Performance Breakdown</h3>
            <Table
              columns={factoryColumns}
              data={report.factory_breakdown}
            />
          </div>

          {/* Top Revenue Goods */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Top Performing Goods</h3>
            <Table
              columns={topGoodsColumns}
              data={report.top_goods}
              emptyMessage="No goods sales recorded for this period."
            />
          </div>

          {/* Executive Signoff / Footer for Print */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800">Prepared By:</p>
              <div className="mt-8 border-b border-slate-300 w-48" />
              <p className="mt-1 font-medium">Factory Operations Controller</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">Approved By:</p>
              <div className="mt-8 border-b border-slate-300 w-48 ml-auto" />
              <p className="mt-1 font-medium">Bluesun Managing Director</p>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
