import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Table from '../components/Table';
import ExpenseModal from '../components/ExpenseModal';
import { getExpenses, deleteExpense } from '../api';
import { Plus, Filter, Calendar, Factory, Trash2, Edit3 } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [factory, setFactory] = useState('All');
  const [month, setMonth] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpenseToEdit, setSelectedExpenseToEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [factory, month]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await getExpenses(factory, month);
      setExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e, row) => {
    e.stopPropagation();
    setSelectedExpenseToEdit(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id, desc) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete expense record "${desc}"?`)) {
      try {
        await deleteExpense(id);
        fetchExpenses();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete expense.');
      }
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-800">{row.date}</span>,
    },
    {
      header: 'Factory',
      accessor: 'factory_name',
      render: (row) => (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
          {row.factory_name}
        </span>
      ),
    },
    {
      header: 'Expense Description',
      accessor: 'expense_description',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800">{row.expense_description}</span>
          {row.is_from_sale ? (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
              Auto from Sale
            </span>
          ) : row.account_holder_name ? (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
              Deducted: {row.account_holder_name}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className="font-extrabold text-amber-600">
          ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          {!row.is_from_sale && (
            <button
              onClick={(e) => handleEdit(e, row)}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Expense"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => handleDelete(e, row.id, row.expense_description)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Expense Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const months = ['All', '2026-08', '2026-07', '2026-06', '2026-05'];

  return (
    <Layout pageTitle="Expenses History">
      {/* Control Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Factory Selector */}
          <div className="flex items-center gap-2">
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

          {/* Month Selector */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
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
        </div>

        {/* Add Manual Expense Button */}
        <button
          onClick={() => {
            setSelectedExpenseToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs tracking-wide shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Manual Expense
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading expenses history...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Expense History Table</h3>
              <p className="text-xs text-slate-500">Includes automatic sale expenses and manual account deductions.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              {expenses.length} Records
            </span>
          </div>

          <Table
            columns={columns}
            data={expenses}
            emptyMessage="No expenses found for selected filters."
          />
        </div>
      )}

      {/* Add / Edit Manual Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpenseToEdit(null);
        }}
        initialData={selectedExpenseToEdit}
        onSuccess={fetchExpenses}
      />
    </Layout>
  );
}
