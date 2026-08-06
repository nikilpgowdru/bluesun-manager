import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Table from '../components/Table';
import { getTransactions } from '../api';
import { ArrowUpDown, Calendar, ArrowUpRight, ArrowDownLeft, Factory } from 'lucide-react';

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('Both'); // "Sales", "Expenses", "Both"
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, selectedMonth]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await getTransactions(filterType, selectedMonth);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row) => {
    if (row.goods_id) {
      navigate(`/goods/${row.goods_id}`);
    } else if (row.account_holder_id) {
      navigate('/account-holders');
    } else {
      navigate('/expenses');
    }
  };

  const columns = [
    {
      header: 'Date (Recent First)',
      accessor: 'date',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-800">{row.date}</span>
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${
          row.type === 'Sale'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {row.type === 'Sale' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
          {row.type}
        </span>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => <span className="font-medium text-slate-800">{row.description}</span>
    },
    {
      header: 'Factory',
      accessor: 'factory_name',
      render: (row) => (
        <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700">
          {row.factory_name}
        </span>
      )
    },
    {
      header: 'Account Holder',
      accessor: 'account_holder_name',
      render: (row) => row.account_holder_name ? (
        <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
          {row.account_holder_name}
        </span>
      ) : (
        <span className="text-slate-400 text-xs font-normal">N/A</span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className={`font-extrabold ${row.type === 'Sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.type === 'Sale' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Transactions Ledger">
      {/* Control Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Three Filters Only */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
          {['Both', 'Sales', 'Expenses'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                filterType === type
                  ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {months.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading financial ledger...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Transaction History</h3>
              <p className="text-xs text-slate-500">Chronological transaction ledger (sorted by Most Recent First).</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg border border-brand-200">
              {transactions.length} Records Found
            </span>
          </div>

          <Table
            columns={columns}
            data={transactions}
            onRowClick={handleRowClick}
            emptyMessage="No transactions found for selected filters."
          />
        </div>
      )}
    </Layout>
  );
}
