import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Table from '../components/Table';
import SaleModal from '../components/SaleModal';
import { getGoodsDetail, deleteGoods, deleteSale } from '../api';
import { ArrowLeft, Plus, Trash2, Factory, Calendar } from 'lucide-react';

export default function GoodsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goodsData, setGoodsData] = useState(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoodsDetail();
  }, [id]);

  const fetchGoodsDetail = async () => {
    try {
      setLoading(true);
      const res = await getGoodsDetail(id);
      setGoodsData(res.data);
    } catch (err) {
      console.error('Error fetching goods details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (window.confirm(`Are you sure you want to delete product "${goodsData?.goods?.brand_name}"?`)) {
      try {
        await deleteGoods(id);
        navigate('/goods');
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete product.');
      }
    }
  };

  const handleDeleteSale = async (e, saleId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this sale record? Available stock will be restored.")) {
      try {
        await deleteSale(saleId);
        fetchGoodsDetail();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete sale.');
      }
    }
  };

  const salesColumns = [
    { header: 'Date', accessor: 'date' },
    {
      header: 'Sold To',
      accessor: 'sold_to',
      render: (row) => <span className="font-extrabold text-slate-900">{row.sold_to}</span>,
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (row) => <span className="font-extrabold text-blue-700">{row.quantity} PCS</span>,
    },
    {
      header: 'Unit Price',
      accessor: 'price',
      render: (row) => <span className="font-bold text-slate-700">₹{row.price.toFixed(2)}</span>,
    },
    {
      header: 'GST Tax',
      accessor: 'gst_amount',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-amber-700">
            +₹{(row.gst_amount || 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-600 font-bold">
            {row.gst_percent ? `${row.gst_percent}% GST` : row.gst_amount > 0 ? 'Custom GST' : 'No GST (0%)'}
          </span>
        </div>
      ),
    },
    {
      header: 'Total Sale',
      accessor: 'total_amount',
      render: (row) => <span className="font-black text-emerald-700">₹{row.total_amount.toFixed(2)}</span>,
    },
    {
      header: 'Receipt',
      accessor: 'receipt',
      render: (row) => <span className="font-mono text-xs text-slate-600 font-bold">{row.receipt}</span>,
    },
    {
      header: 'Receiver',
      accessor: 'receiver',
      render: (row) => (
        <div className="flex flex-col">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold w-fit ${
            row.receiver === 'Saving'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {row.receiver}
          </span>
          <span className="text-[10px] text-slate-600 mt-0.5 font-semibold">
            {row.receiver === 'Saving' ? row.account_holder_name || 'Account Deposit' : row.expense_description || 'Expense Entry'}
          </span>
        </div>
      ),
    },
    {
      header: 'Delete',
      accessor: 'delete_action',
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => handleDeleteSale(e, row.id)}
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete Sale Record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout pageTitle="Goods Details">
        <div className="py-20 text-center text-slate-500 font-bold animate-pulse">
          Loading product overview & sales history...
        </div>
      </Layout>
    );
  }

  if (!goodsData) {
    return (
      <Layout pageTitle="Goods Details">
        <div className="p-8 bg-white rounded-2xl border text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Product Not Found</h3>
          <button
            onClick={() => navigate('/goods')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
          >
            Back to Goods List
          </button>
        </div>
      </Layout>
    );
  }

  const { goods, sales } = goodsData;

  return (
    <Layout pageTitle={`Goods Details - ${goods.brand_name}`}>
      {/* Top Header Back & Action Buttons */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/goods')}
          className="flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Goods List
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteProduct}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-xs border border-rose-200 hover:bg-rose-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete Product
          </button>

          <button
            onClick={() => setIsSaleModalOpen(true)}
            disabled={goods.available_pcs <= 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Sale
          </button>
        </div>
      </div>

      {/* Product Overview Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-lg border border-blue-200 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" />
                {goods.factory_name} Factory
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Mfg Date: {goods.manufacture_date}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{goods.brand_name}</h1>
            <p className="text-sm text-slate-600 font-bold">{goods.type}</p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Total Earnings</div>
              <div className="text-xl font-black text-emerald-700">
                ₹{goods.total_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Available Stock</div>
              <div className="text-xl font-black text-blue-700">
                {goods.available_pcs.toLocaleString()} <span className="text-xs font-bold text-slate-500">PCS</span>
              </div>
            </div>
          </div>
        </div>

        {/* PCS Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase">Total PCS</span>
            <p className="text-lg font-black text-slate-900 mt-1">{goods.total_pcs.toLocaleString()}</p>
          </div>
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase">Rejected PCS</span>
            <p className="text-lg font-black text-amber-900 mt-1">{goods.rejected_pcs.toLocaleString()}</p>
          </div>
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase">Passed PCS</span>
            <p className="text-lg font-black text-emerald-900 mt-1">{goods.passed_pcs.toLocaleString()}</p>
          </div>
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200">
            <span className="text-[11px] font-extrabold text-blue-800 uppercase">Available PCS</span>
            <p className="text-lg font-black text-blue-900 mt-1">{goods.available_pcs.toLocaleString()}</p>
          </div>
          <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase">Sold PCS</span>
            <p className="text-lg font-black text-slate-900 mt-1">{goods.sold_pcs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Sales History</h3>
            <p className="text-xs text-slate-600 font-semibold">Recorded sales transactions & GST breakdown for this product lot.</p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
            {sales.length} Sales Recorded
          </span>
        </div>

        <Table
          columns={salesColumns}
          data={sales}
          emptyMessage="No sales recorded for this product yet. Click 'Add Sale' to record a transaction."
        />
      </div>

      {/* Add Sale Modal */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        goodsId={goods.id}
        availablePcs={goods.available_pcs}
        onSuccess={fetchGoodsDetail}
      />
    </Layout>
  );
}
