import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Table from '../components/Table';
import GoodsModal from '../components/GoodsModal';
import { getGoods, deleteGoods } from '../api';
import { Plus, Filter, Calendar, Trash2, Edit3, Crown, Sparkles } from 'lucide-react';

export default function Goods() {
  const navigate = useNavigate();
  const [goods, setGoods] = useState([]);
  const [factory, setFactory] = useState('All');
  const [month, setMonth] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoodsToEdit, setSelectedGoodsToEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoods();
  }, [factory, month]);

  const fetchGoods = async () => {
    try {
      setLoading(true);
      const res = await getGoods(factory, month);
      setGoods(res.data);
    } catch (err) {
      console.error('Error fetching goods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e, row) => {
    e.stopPropagation();
    setSelectedGoodsToEdit(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id, brandName) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete product "${brandName}"? All associated sales and transactions will also be deleted.`)) {
      try {
        await deleteGoods(id);
        fetchGoods();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete goods item.');
      }
    }
  };

  const getFactoryBadge = (factoryName) => {
    switch (factoryName) {
      case 'Jeans':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">👖 Jeans</span>;
      case 'Shirts':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">👔 Shirts</span>;
      case 'Formals':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">🧥 Formals</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">{factoryName}</span>;
    }
  };

  const columns = [
    {
      header: 'Apparel Line',
      accessor: 'factory_name',
      render: (row) => getFactoryBadge(row.factory_name),
    },
    { 
      header: 'Type', 
      accessor: 'type',
      render: (row) => <span className="font-bold text-slate-300">{row.type}</span>
    },
    {
      header: 'Brand Collection',
      accessor: 'brand_name',
      render: (row) => (
        <span className="font-black text-amber-300 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" /> {row.brand_name}
        </span>
      ),
    },
    { header: 'Manufacture Date', accessor: 'manufacture_date' },
    {
      header: 'Total PCS',
      accessor: 'total_pcs',
      render: (row) => <span className="font-bold text-slate-200">{row.total_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Rejected PCS',
      accessor: 'rejected_pcs',
      render: (row) => <span className="text-amber-400 font-bold">{row.rejected_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Passed PCS',
      accessor: 'passed_pcs',
      render: (row) => <span className="text-emerald-400 font-bold">{row.passed_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Available PCS',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30">
          {row.available_pcs.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Sold PCS',
      accessor: 'sold_pcs',
      render: (row) => <span className="font-bold text-slate-300">{row.sold_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Total Earnings',
      accessor: 'total_earnings',
      render: (row) => (
        <span className="font-black text-emerald-400 text-sm">
          ₹{row.total_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => handleEdit(e, row)}
            className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg border border-indigo-500/30 transition-all"
            title="Edit Collection Record"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDelete(e, row.id, row.brand_name)}
            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg border border-rose-500/30 transition-all"
            title="Delete Collection Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Garment Inventory & Production">
      {/* Control Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 atelier-card p-5 rounded-2xl border border-slate-800 shadow-xl">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Factory Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Apparel Line:</span>
            <select
              value={factory}
              onChange={(e) => setFactory(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Lines</option>
              <option value="Jeans">Jeans</option>
              <option value="Shirts">Shirts</option>
              <option value="Formals">Formals</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {months.map(m => (
                <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Garment Button */}
        <button
          onClick={() => {
            setSelectedGoodsToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:from-amber-400 hover:to-indigo-500 transition-all ring-1 ring-white/20"
        >
          <Plus className="w-4 h-4" />
          Add Garment Collection
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-24 text-center text-amber-400/80 font-bold uppercase tracking-widest animate-pulse">
          Loading Garment Collections...
        </div>
      ) : (
        <div className="atelier-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Garment Inventory Register
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Click any row to open sales details & issue new customer sales.</p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 uppercase tracking-widest">
              {goods.length} Collections Listed
            </span>
          </div>

          <Table
            columns={columns}
            data={goods}
            onRowClick={(row) => navigate(`/goods/${row.id}`)}
            emptyMessage="No garment collections found for selected filters."
          />
        </div>
      )}

      {/* Add / Edit Goods Modal */}
      <GoodsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGoodsToEdit(null);
        }}
        initialData={selectedGoodsToEdit}
        onSuccess={fetchGoods}
      />
    </Layout>
  );
}
