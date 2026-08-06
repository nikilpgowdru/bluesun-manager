import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { getChansandraSummary, createChansandraEntry, deleteChansandraEntry } from '../api';
import { Landmark, Plus, Trash2, Package, Shirt, Sparkles, AlertCircle, Calendar } from 'lucide-react';

export default function Chansandra() {
  const [summary, setSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    factory_name: 'Jeans',
    brand_name: '',
    type: '',
    quantity: '',
    amount: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getChansandraSummary(selectedMonth);
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching Chansandra summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(formData.quantity);
    const amt = parseFloat(formData.amount);

    if (!formData.brand_name.trim() || !formData.type.trim()) {
      setError('Please provide Brand Name and Garment Product Type.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity (PCS) must be greater than 0.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError('Payback Amount (₹) must be greater than 0.');
      return;
    }

    try {
      setSubmitLoading(true);
      await createChansandraEntry({
        ...formData,
        quantity: qty,
        amount: amt,
      });
      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        factory_name: 'Jeans',
        brand_name: '',
        type: '',
        quantity: '',
        amount: '',
        notes: '',
      });
      fetchSummary();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add Chansandra loan payback entry.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this Chansandra loan payback entry?')) {
      try {
        await deleteChansandraEntry(id);
        fetchSummary();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete entry.');
      }
    }
  };

  const getFactoryBadge = (factoryName) => {
    switch (factoryName) {
      case 'Jeans':
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">👖 Jeans</span>;
      case 'Shirts':
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-teal-50 text-teal-700 border border-teal-200">👔 Shirts</span>;
      case 'Formals':
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-purple-50 text-purple-700 border border-purple-200">🧥 Formals</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-slate-100 text-slate-800">{factoryName}</span>;
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-bold text-slate-800">{row.date}</span>
    },
    {
      header: 'Line',
      accessor: 'factory_name',
      render: (row) => getFactoryBadge(row.factory_name)
    },
    {
      header: 'Product & Brand',
      accessor: 'brand_name',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900">{row.brand_name}</span>
          <span className="text-[10px] text-slate-500 font-bold">{row.type}</span>
        </div>
      )
    },
    {
      header: 'Quantity Provided',
      accessor: 'quantity',
      render: (row) => (
        <span className="font-extrabold text-indigo-700">
          {row.quantity} PCS
        </span>
      )
    },
    {
      header: 'Loan Payback Amount',
      accessor: 'amount',
      render: (row) => (
        <span className="font-black text-emerald-700 text-sm">
          ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (row) => <span className="text-xs text-slate-600 font-semibold">{row.notes || '—'}</span>
    },
    {
      header: 'Delete',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => handleDelete(e, row.id)}
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete Entry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04'];

  return (
    <Layout title="Chansandra Loan Payback Ledger">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading uppercase">
            Chansandra Loan Payback Section
          </h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Tracks goods provided to pay back Chansandra loan. Reflects automatically in Total Sales Revenue without depositing to bank accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none"
            >
              {months.map(m => (
                <option key={m} value={m} className="text-slate-900 font-bold bg-white">{m === 'All' ? 'All Months' : m}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Chansandra Goods Payback
          </button>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold block text-sm text-indigo-950">Chansandra Loan Accounting Rule</span>
          Entries recorded here represent physical garment stock (Jeans, Shirts, Formals) supplied to repay loan obligations. The rupee value is added directly to Overall Total Sales Revenue on your Dashboard & Reports, but does not impact cash/bank account balances.
        </div>
      </div>

      {/* Top Cards Breakdown */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Chansandra Payback"
            value={`₹${summary.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={Landmark}
            subtitle="Added to Sales Revenue"
            color="indigo"
          />
          <StatCard
            title="Total Garments Supplied"
            value={`${summary.total_pcs.toLocaleString()} PCS`}
            icon={Package}
            subtitle="Combined Unit Count"
            color="emerald"
          />
          <StatCard
            title="👖 Jeans Supplied"
            value={`${summary.jeans_pcs} PCS`}
            icon={Shirt}
            subtitle={`₹${summary.jeans_amount.toLocaleString('en-IN')}`}
            color="blue"
          />
          <StatCard
            title="👔 Shirts Supplied"
            value={`${summary.shirts_pcs} PCS`}
            icon={Shirt}
            subtitle={`₹${summary.shirts_amount.toLocaleString('en-IN')}`}
            color="teal"
          />
          <StatCard
            title="🧥 Formals Supplied"
            value={`${summary.formals_pcs} PCS`}
            icon={Shirt}
            subtitle={`₹${summary.formals_amount.toLocaleString('en-IN')}`}
            color="purple"
          />
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading Chansandra payback ledger...
        </div>
      ) : summary ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">Chansandra Loan Payback History</h3>
              <p className="text-xs text-slate-500 font-semibold">List of all garment dispatches for Chansandra loan settlement.</p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              {summary.entries.length} Entries Recorded
            </span>
          </div>

          <Table
            columns={columns}
            data={summary.entries}
            emptyMessage="No Chansandra loan payback entries recorded yet."
          />
        </div>
      ) : null}

      {/* Add Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Chansandra Loan Payback Entry"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Apparel Factory Line *
              </label>
              <select
                value={formData.factory_name}
                onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
              >
                <option value="Jeans">👖 Jeans</option>
                <option value="Shirts">👔 Shirts</option>
                <option value="Formals">🧥 Formals</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Brand Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Bluesun Denim"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Garment Product Type *
              </label>
              <input
                type="text"
                placeholder="e.g. Slim Fit Jeans / Cotton Shirt"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Quantity (PCS) *
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Payback Value Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 25000.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Notes / Delivery Reference (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Dispatched 50 pcs Jeans lot via Chansandra courier reference #402"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs placeholder:text-slate-400"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-colors"
            >
              {submitLoading ? 'Saving Entry...' : 'Save Chansandra Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
