import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Table from '../components/Table';
import GoodsModal from '../components/GoodsModal';
import { getGoods, deleteGoods } from '../api';
import { Plus, Filter, Calendar, Factory, Trash2, Edit3 } from 'lucide-react';

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

  const columns = [
    {
      header: 'Factory',
      accessor: 'factory_name',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
          <Factory className="w-3 h-3" />
          {row.factory_name}
        </span>
      ),
    },
    { header: 'Type', accessor: 'type' },
    {
      header: 'Brand Name',
      accessor: 'brand_name',
      render: (row) => <span className="font-extrabold text-slate-800">{row.brand_name}</span>,
    },
    { header: 'Manufacture Date', accessor: 'manufacture_date' },
    {
      header: 'Total PCS',
      accessor: 'total_pcs',
      render: (row) => <span>{row.total_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Rejected PCS',
      accessor: 'rejected_pcs',
      render: (row) => <span className="text-amber-600 font-semibold">{row.rejected_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Passed PCS',
      accessor: 'passed_pcs',
      render: (row) => <span className="text-emerald-600 font-bold">{row.passed_pcs.toLocaleString()}</span>,
    },
    {
      header: 'Available PCS',
      accessor: 'available_pcs',
      render: (row) => (
        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {row.available_pcs.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Sold PCS',
      accessor: 'sold_pcs',
      render: (row) => <span>{row.sold_pcs.toLocaleString()}</span>,
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
    <Layout pageTitle="Goods Production History">
      {/* Control Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Quick Select Filter Buttons */}
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
              All Factories
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
          Add Goods
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading production history...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Production History Table</h3>
              <p className="text-xs text-slate-500">Click any product row to view sales history & record new sales.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              {goods.length} Items Listed
            </span>
          </div>

          <Table
            columns={columns}
            data={goods}
            onRowClick={(row) => navigate(`/goods/${row.id}`)}
            emptyMessage="No production goods found for selected filters."
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
