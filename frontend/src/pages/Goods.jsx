import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import GoodsModal from '../components/GoodsModal';
import { getGoods, deleteGoods } from '../api';
import { Plus, Calendar, Factory, Trash2, Edit3, Package, Tag, Shirt, Landmark, AlertTriangle } from 'lucide-react';

export default function Goods() {
  const navigate = useNavigate();
  const [goods, setGoods] = useState([]);
  const [allGoods, setAllGoods] = useState([]);
  const [factory, setFactory] = useState('All');
  const [month, setMonth] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoodsToEdit, setSelectedGoodsToEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoods();
  }, [factory, month, selectedBatch]);

  const fetchGoods = async () => {
    try {
      setLoading(true);
      const [filteredRes, allRes] = await Promise.all([
        getGoods(factory, month, selectedBatch),
        getGoods('All', 'All', 'All')
      ]);
      setGoods(filteredRes.data);
      setAllGoods(allRes.data);
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
    if (window.confirm(`Are you sure you want to delete product batch "${brandName}"? All associated sales and transactions will also be deleted.`)) {
      try {
        await deleteGoods(id);
        fetchGoods();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete goods item.');
      }
    }
  };

  // Compute live category statistics from ALL goods so metrics are never hidden by active filters
  const computeStats = () => {
    let jeansMfg = 0, jeansDef = 0, jeansAvail = 0;
    let shirtsMfg = 0, shirtsDef = 0, shirtsAvail = 0;
    let formalsMfg = 0, formalsDef = 0, formalsAvail = 0;
    let totalAvail = 0, totalDef = 0;

    allGoods.forEach(g => {
      totalAvail += g.available_pcs;
      totalDef += g.rejected_pcs;

      if (g.factory_name === 'Jeans') {
        jeansMfg += g.total_pcs;
        jeansDef += g.rejected_pcs;
        jeansAvail += g.available_pcs;
      } else if (g.factory_name === 'Shirts') {
        shirtsMfg += g.total_pcs;
        shirtsDef += g.rejected_pcs;
        shirtsAvail += g.available_pcs;
      } else if (g.factory_name === 'Formals') {
        formalsMfg += g.total_pcs;
        formalsDef += g.rejected_pcs;
        formalsAvail += g.available_pcs;
      }
    });

    return {
      totalAvail,
      totalDef,
      jeans: { mfg: jeansMfg, def: jeansDef, avail: jeansAvail },
      shirts: { mfg: shirtsMfg, def: shirtsDef, avail: shirtsAvail },
      formals: { mfg: formalsMfg, def: formalsDef, avail: formalsAvail },
    };
  };

  const stats = computeStats();

  // Extract unique batch numbers from all goods
  const uniqueBatches = Array.from(new Set(allGoods.map(g => g.batch_number).filter(Boolean)));

  const columns = [
    {
      header: 'Batch #',
      accessor: 'batch_number',
      render: (row) => (
        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
          {row.batch_number || 'BATCH-DEFAULT'}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'factory_name',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
          row.factory_name === 'Jeans' ? 'bg-blue-100 text-blue-800' :
          row.factory_name === 'Shirts' ? 'bg-emerald-100 text-emerald-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          <Factory className="w-3 h-3" />
          {row.factory_name}
        </span>
      ),
    },
    {
      header: 'Garment & Brand',
      accessor: 'brand_name',
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-900">{row.brand_name}</div>
          <span className="text-xs text-slate-500 font-semibold">{row.type}</span>
        </div>
      ),
    },
    { header: 'Mfg Date', accessor: 'manufacture_date' },
    {
      header: 'Manufactured PCS',
      accessor: 'total_pcs',
      render: (row) => <span className="font-bold text-slate-800">{row.total_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Defective PCS',
      accessor: 'rejected_pcs',
      render: (row) => <span className="text-rose-600 font-black">{row.rejected_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Passed PCS',
      accessor: 'passed_pcs',
      render: (row) => <span className="text-emerald-700 font-bold">{row.passed_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Available PCS',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-sm">
          {row.available_pcs.toLocaleString()} PCS
        </span>
      ),
    },
    {
      header: 'Sold PCS',
      accessor: 'sold_pcs',
      render: (row) => <span className="font-semibold text-slate-700">{row.sold_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Total Earnings',
      accessor: 'total_earnings',
      render: (row) => (
        <span className="font-extrabold text-slate-900">
          ₹{row.total_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => handleEdit(e, row)}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Goods Item"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDelete(e, row.id, row.brand_name)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Goods Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout title="Batch Garment Inventory">
      {/* Category Breakdown StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Stock Available"
          value={`${stats.totalAvail.toLocaleString()} PCS`}
          subtitle="Ready to sell"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="👖 Jeans Available"
          value={`${stats.jeans.avail.toLocaleString()} PCS`}
          subtitle={`Mfg: ${stats.jeans.mfg} | Defective: ${stats.jeans.def}`}
          icon={Tag}
          color="blue"
        />
        <StatCard
          title="👔 Shirts Available"
          value={`${stats.shirts.avail.toLocaleString()} PCS`}
          subtitle={`Mfg: ${stats.shirts.mfg} | Defective: ${stats.shirts.def}`}
          icon={Shirt}
          color="emerald"
        />
        <StatCard
          title="🧥 Formals Available"
          value={`${stats.formals.avail.toLocaleString()} PCS`}
          subtitle={`Mfg: ${stats.formals.mfg} | Defective: ${stats.formals.def}`}
          icon={Landmark}
          color="amber"
        />
        <StatCard
          title="Defective / Rejected"
          value={`${stats.totalDef.toLocaleString()} PCS`}
          subtitle="Quality Rejections"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Quick Select Filter Buttons & Batch Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setFactory('All')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                factory === 'All'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              All Garments
            </button>
            <button
              onClick={() => setFactory('Jeans')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all ${
                factory === 'Jeans'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30'
                  : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              👖 Jeans
            </button>
            <button
              onClick={() => setFactory('Shirts')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all ${
                factory === 'Shirts'
                  ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/30'
                  : 'text-teal-700 bg-teal-50/80 hover:bg-teal-100 border border-teal-200/60'
              }`}
            >
              👔 Shirts
            </button>
            <button
              onClick={() => setFactory('Formals')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all ${
                factory === 'Formals'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/30'
                  : 'text-purple-700 bg-purple-50/80 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              🧥 Formals
            </button>
          </div>

          {/* Batch Filter */}
          {uniqueBatches.length > 0 && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Batch:</span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs font-mono"
              >
                <option value="All">All Batches</option>
                {uniqueBatches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Filter */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              {months.map(m => (
                <option key={m} value={m} className="text-slate-900 font-bold bg-white">{m === 'All' ? 'All Months' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Goods Button */}
        <button
          onClick={() => {
            setSelectedGoodsToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          + Add Production Batch
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading batch garment inventory...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase">Batch Inventory Table</h3>
              <p className="text-xs text-slate-500 font-semibold">Click any batch row to view sales history & record individual lot sales.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              {goods.length} Batches Listed
            </span>
          </div>

          <Table
            columns={columns}
            data={goods}
            onRowClick={(row) => navigate(`/goods/${row.id}`)}
            emptyMessage="No batch inventory found for selected filters."
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
