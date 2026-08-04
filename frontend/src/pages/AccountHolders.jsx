import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import AccountHolderModal from '../components/AccountHolderModal';
import AccountBalanceModal from '../components/AccountBalanceModal';
import { getAccountHolders, getAccountHistory, deleteAccountHolder } from '../api';
import { Plus, Landmark, History, ArrowUpRight, ArrowDownLeft, Trash2, Edit3, ArrowUpDown } from 'lucide-react';

export default function AccountHolders() {
  const [accountHolders, setAccountHolders] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccountToEdit, setSelectedAccountToEdit] = useState(null);
  const [selectedAccountToAdjust, setSelectedAccountToAdjust] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
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

  const handleAdjust = (e, row) => {
    e.stopPropagation();
    setSelectedAccountToAdjust(row);
    setIsAdjustModalOpen(true);
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
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Landmark className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-900 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Current Balance',
      accessor: 'current_balance',
      render: (row) => (
        <span className={`font-black text-base ${row.current_balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          ₹{row.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleAdjust(e, row)}
            className="px-3 py-1.5 text-xs font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 shadow-xs"
            title="Manually Add or Subtract Amount"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Adjust Balance (+/-)
          </button>
          <button
            onClick={(e) => handleEdit(e, row)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Account Holder"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDelete(e, row.id, row.name)}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Account Holder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    { 
      header: 'Date', 
      accessor: 'date',
      render: (row) => <span className="font-semibold text-slate-700">{row.date}</span>
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-extrabold rounded-md ${
          row.type === 'Sale'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {row.type === 'Sale' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
          {row.type === 'Sale' ? 'Deposit / Sale' : 'Withdrawal / Expense'}
        </span>
      ),
    },
    { 
      header: 'Description', 
      accessor: 'description',
      render: (row) => <span className="font-bold text-slate-800">{row.description}</span>
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className={`font-black ${row.type === 'Sale' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {row.type === 'Sale' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <Layout pageTitle="Account Holders">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider font-heading">Account Holders & Reserves</h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">Manage accounts, view full transaction ledgers, or manually add/subtract amounts.</p>
        </div>
        <button
          onClick={() => {
            setSelectedAccountToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Account Holder
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-bold animate-pulse">
          Loading account holders...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-heading">Account Holders Table</h3>
              <p className="text-xs text-slate-600 font-semibold">Click any account holder row to inspect full transaction ledger history.</p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              {accountHolders.length} Active Accounts
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
          <div className="py-12 text-center text-slate-500 font-bold animate-pulse">
            Loading transaction ledger...
          </div>
        ) : selectedAccountHistory ? (
          <div className="space-y-4 text-slate-900">
            <div className="bg-blue-50/90 p-4 rounded-xl border border-blue-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Account Holder</span>
                <h4 className="text-lg font-extrabold text-slate-900">{selectedAccountHistory.account_holder.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Current Balance</span>
                <h4 className="text-xl font-black text-emerald-700">
                  ₹{selectedAccountHistory.account_holder.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h4>
              </div>
            </div>

            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pt-2 flex items-center gap-2 font-heading">
              <History className="w-4 h-4 text-blue-600" />
              Complete Transaction Ledger History
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

      {/* Balance Adjustment (+/-) Modal */}
      <AccountBalanceModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedAccountToAdjust(null);
        }}
        accountHolder={selectedAccountToAdjust}
        onSuccess={fetchAccountHolders}
      />
    </Layout>
  );
}
