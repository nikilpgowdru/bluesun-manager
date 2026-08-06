import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import MultiSaleModal from '../components/MultiSaleModal';
import { getSalesSummary, getAllSales, deleteSale } from '../api';
import { ShoppingBag, Plus, Calendar, Search, Trash2, Tag, Shirt, Landmark, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sales() {
  const [summary, setSummary] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMultiSaleOpen, setIsMultiSaleOpen] = useState(false);
  const navigate = useNavigate();

  const months = [
    'All', 
    '2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01',
    '2025-12', '2025-11', '2025-10', '2025-09', '2025-08', '2025-07', '2025-06', '2025-05', '2025-04', '2025-03', '2025-02', '2025-01'
  ];

  useEffect(() => {
    fetchSalesData();
  }, [selectedMonth]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [sumRes, salesRes] = await Promise.all([
        getSalesSummary(selectedMonth),
        getAllSales(selectedMonth)
      ]);
      setSummary(sumRes.data);
      setSalesList(salesRes.data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (e, saleId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this sale record? Stock and earnings will be reverted.')) {
      return;
    }
    try {
      await deleteSale(saleId);
      fetchSalesData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete sale.');
    }
  };

  const handleRowClick = (row) => {
    if (row.goods_id) {
      navigate(`/goods/${row.goods_id}`);
    }
  };

  const filteredSales = salesList.filter(s => 
    (s.sold_to || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.receipt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.factory_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.batch_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'Date (Recent First)',
      accessor: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900">{row.date}</span>
    },
    {
      header: 'Batch #',
      accessor: 'batch_number',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold">
          {row.batch_number || 'BATCH-DEFAULT'}
        </span>
      )
    },
    {
      header: 'Garment / Brand',
      accessor: 'brand_name',
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-900">{row.brand_name} ({row.type})</div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
            row.factory_name === 'Jeans' ? 'bg-blue-100 text-blue-800' :
            row.factory_name === 'Shirts' ? 'bg-emerald-100 text-emerald-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {row.factory_name}
          </span>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'sold_to',
      render: (row) => <span className="font-bold text-slate-800">{row.sold_to}</span>
    },
    {
      header: 'Receipt #',
      accessor: 'receipt',
      render: (row) => <span className="font-mono text-xs text-slate-600 font-bold">{row.receipt}</span>
    },
    {
      header: 'Qty (PCS)',
      accessor: 'quantity',
      render: (row) => <span className="font-black text-slate-900">{row.quantity} PCS</span>
    },
    {
      header: 'Price (₹)',
      accessor: 'price',
      render: (row) => <span className="font-bold text-slate-700">₹{row.price.toLocaleString('en-IN')}</span>
    },
    {
      header: 'GST (₹)',
      accessor: 'gst_amount',
      render: (row) => <span className="text-slate-600 font-semibold">₹{row.gst_amount.toLocaleString('en-IN')}</span>
    },
    {
      header: 'Total Amount (₹)',
      accessor: 'total_amount',
      render: (row) => <span className="font-black text-emerald-700">₹{row.total_amount.toLocaleString('en-IN')}</span>
    },
    {
      header: 'Payment Status',
      accessor: 'payment_status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
          row.payment_status === 'Paid'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : row.payment_status === 'Pending'
            ? 'bg-rose-100 text-rose-800 border border-rose-300'
            : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          {row.payment_status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => handleDeleteSale(e, row.id)}
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete Sale Record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <Layout title="Garment Sales Hub">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading uppercase">
            Garment Sales Section & Summary
          </h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Record multi-garment sales checkout (Shirts, Jeans, Formals) and manage complete sales history.
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
            onClick={() => setIsMultiSaleOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Multi-Item Sale
          </button>
        </div>
      </div>

      {/* Garment Category Sales Summary Dashboard */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Revenue"
            value={`₹${summary.overall_total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle={`${summary.overall_units_sold} Units Sold`}
            icon={ShoppingBag}
            color="emerald"
          />
          <StatCard
            title="👖 Jeans Sales"
            value={`₹${summary.jeans.total_revenue.toLocaleString('en-IN')}`}
            subtitle={`${summary.jeans.units_sold} PCS Sold`}
            icon={Tag}
            color="blue"
          />
          <StatCard
            title="👔 Shirts Sales"
            value={`₹${summary.shirts.total_revenue.toLocaleString('en-IN')}`}
            subtitle={`${summary.shirts.units_sold} PCS Sold`}
            icon={Shirt}
            color="emerald"
          />
          <StatCard
            title="🧥 Formals Sales"
            value={`₹${summary.formals.total_revenue.toLocaleString('en-IN')}`}
            subtitle={`${summary.formals.units_sold} PCS Sold`}
            icon={Landmark}
            color="amber"
          />
          <StatCard
            title="Customer Dues"
            value={`₹${summary.overall_pending_balance.toLocaleString('en-IN')}`}
            subtitle="Pay Later Dues"
            icon={AlertCircle}
            color="rose"
          />
        </div>
      )}

      {/* Sales History Table Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase">Complete Sales History</h3>
            <p className="text-xs text-slate-500 font-semibold">Click any sale row to jump to associated stock details.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, receipt, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredSales}
          onRowClick={handleRowClick}
          emptyMessage="No sales records found for this period"
        />
      </div>

      {/* Multi-Item Sale Checkout Modal */}
      <MultiSaleModal
        isOpen={isMultiSaleOpen}
        onClose={() => setIsMultiSaleOpen(false)}
        onSuccess={fetchSalesData}
      />
    </Layout>
  );
}
