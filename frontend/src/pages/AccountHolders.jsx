import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import AccountHolderModal from '../components/AccountHolderModal';
import { getAccountHolders, getAccountHistory, deleteAccountHolder } from '../api';
import { Plus, Landmark, History, ArrowUpRight, ArrowDownLeft, Trash2, Edit3 } from 'lucide-react';

export default function AccountHolders() {
  const [accountHolders, setAccountHolders] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccountToEdit, setSelectedAccountToEdit] = useState(null);
  const [selectedAccountHistory, setSelectedAccountHistory] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchAccountHolders();
  }, []);

  const fetchAccountHolders = async () => {
    try {
      setLoading(true);
      const res = await getAccountHolders();
      setAccountHolders(res.data);
    } catch (err) {
      console.error('Error fetching account holders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = async (row) => {
    try {
      setHistoryLoading(true);
      setIsHistoryModalOpen(true);
      const res = await getAccountHistory(row.id);
      setSelectedAccountHistory(res.data);
    } catch (err) {
      console.error('Error fetching account history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEdit = (e, row) => {
    e.stopPropagation();
    setSelectedAccountToEdit(row);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Account Holder "${name}"?`)) {
      try {
        await deleteAccountHolder(id);
        fetchAccountHolders();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete Account Holder.');
      }
    }
  };

  const columns = [
    {
      header: 'Account Holder Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <Landmark className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-800 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Current Balance',
      accessor: 'current_balance',
      render: (row) => (
        <span className={`font-extrabold text-base ${row.current_balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          ₹{row.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            title="Edit Account Holder"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDelete(e, row.id, row.name)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Account Holder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    { header: 'Date', accessor: 'date' },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-lg ${
          row.type === 'Sale'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {row.type === 'Sale' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
          {row.type}
        </span>
      ),
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className={`font-extrabold ${row.type === 'Sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.type === 'Sale' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <Layout pageTitle="Account Holders">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Account Accounts & Reserves</h2>
          <p className="text-xs text-slate-500 font-medium">Balances update automatically from sales deposits and manual expenses.</p>
        </div>
        <button
          onClick={() => {
            setSelectedAccountToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs tracking-wide shadow-md shadow-brand-600/20 hover:bg-brand-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Account Holder
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading account holders...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Account Holders Table</h3>
              <p className="text-xs text-slate-500">Click any account holder to view complete ledger history.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {accountHolders.length} Active Holders
            </span>
          </div>

          <Table
            columns={columns}
            data={accountHolders}
            onRowClick={handleAccountClick}
            emptyMessage="No account holders registered yet."
          />
        </div>
      )}

      {/* Account History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedAccountHistory(null);
        }}
        title={`Account History - ${selectedAccountHistory?.account_holder?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        {historyLoading ? (
          <div className="py-12 text-center text-slate-400 font-medium animate-pulse">
            Loading transaction history...
          </div>
        ) : selectedAccountHistory ? (
          <div className="space-y-4">
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Holder</span>
                <h4 className="text-lg font-extrabold text-slate-900">{selectedAccountHistory.account_holder.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Balance</span>
                <h4 className="text-xl font-extrabold text-emerald-600">
                  ₹{selectedAccountHistory.account_holder.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h4>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-800 pt-2 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Complete Transaction Ledger
            </h4>

            <Table
              columns={historyColumns}
              data={selectedAccountHistory.transactions}
              emptyMessage="No transaction history recorded for this account holder yet."
            />
          </div>
        ) : null}
      </Modal>

      {/* Add / Edit Account Holder Modal */}
      <AccountHolderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedAccountToEdit(null);
        }}
        initialData={selectedAccountToEdit}
        onSuccess={fetchAccountHolders}
      />
    </Layout>
  );
}
