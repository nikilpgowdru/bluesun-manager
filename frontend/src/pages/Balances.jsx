import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { getPendingBalances, settleSaleBalance, getAccountHolders } from '../api';
import { Scale, DollarSign, Clock, CheckCircle2, Factory, ArrowRight } from 'lucide-react';

export default function Balances() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settle Balance Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [accountHolders, setAccountHolders] = useState([]);
  const [settleData, setSettleData] = useState({
    amount_paid: '',
    account_holder_id: '',
  });
  const [settleError, setSettleError] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await getPendingBalances();
      setBalances(res.data);
    } catch (err) {
      console.error('Error fetching pending balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettleModal = async (e, sale) => {
    e.stopPropagation();
    setSelectedSale(sale);
    setSettleData({
      amount_paid: sale.balance_due,
      account_holder_id: '',
    });
    setSettleError('');

    try {
      const res = await getAccountHolders();
      setAccountHolders(res.data);
      if (res.data.length > 0) {
        setSettleData(prev => ({ ...prev, account_holder_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching account holders:', err);
    }

    setIsSettleModalOpen(true);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setSettleError('');

    const amt = parseFloat(settleData.amount_paid);
    if (isNaN(amt) || amt <= 0) {
      setSettleError('Payment amount must be greater than 0.');
      return;
    }
    if (amt > selectedSale.balance_due) {
      setSettleError(`Payment amount cannot exceed remaining balance (₹${selectedSale.balance_due}).`);
      return;
    }

    try {
      setSettleLoading(true);
      await settleSaleBalance(selectedSale.sale_id, {
        amount_paid: amt,
        account_holder_id: settleData.account_holder_id ? parseInt(settleData.account_holder_id) : null,
      });
      setIsSettleModalOpen(false);
      fetchBalances();
    } catch (err) {
      setSettleError(err.response?.data?.detail || 'Failed to settle balance.');
    } finally {
      setSettleLoading(false);
    }
  };

  const totalOutstanding = balances.reduce((sum, b) => sum + (b.balance_due || 0), 0);
  const totalCollected = balances.reduce((sum, b) => sum + (b.paid_amount || 0), 0);

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-bold text-slate-800">{row.date}</span>
    },
    {
      header: 'Customer Name',
      accessor: 'sold_to',
      render: (row) => (
        <span className="font-black text-slate-900 text-sm">
          {row.sold_to}
        </span>
      )
    },
    {
      header: 'Product Lot',
      accessor: 'brand_name',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900">{row.brand_name}</span>
          <span className="text-[10px] text-slate-500 font-bold">{row.factory_name} Line ({row.type})</span>
        </div>
      )
    },
    {
      header: 'Total Sale',
      accessor: 'total_amount',
      render: (row) => (
        <span className="font-extrabold text-slate-900">
          ₹{row.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Paid Amount',
      accessor: 'paid_amount',
      render: (row) => (
        <span className="font-bold text-emerald-600">
          ₹{row.paid_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Balance Due',
      accessor: 'balance_due',
      render: (row) => (
        <span className="font-black text-rose-600 text-base">
          ₹{row.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
          row.payment_status === 'Pending'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {row.payment_status === 'Pending' ? 'Pay Later (100% Due)' : 'Partial Payment'}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => handleOpenSettleModal(e, row)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-xs transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Collect Balance
        </button>
      )
    }
  ];

  return (
    <Layout title="Pending Balances (Pay Later)">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading uppercase">
            Pending Customer Dues Ledger
          </h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Complete history of customer sales with pending balance or pay-later agreements. Click any row to jump to product details.
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard
          title="Total Outstanding Dues"
          value={`₹${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={Scale}
          subtitle="Uncollected Customer Balances"
          color="amber"
        />
        <StatCard
          title="Pending Sales Records"
          value={`${balances.length} Orders`}
          icon={Clock}
          subtitle="Sales Awaiting Full Payment"
          color="indigo"
        />
        <StatCard
          title="Collected So Far"
          value={`₹${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          subtitle="Partial Cash Received"
          color="emerald"
        />
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
          Loading pending customer balances...
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">Pending Balances Table</h3>
              <p className="text-xs text-slate-500 font-semibold">Click any row to navigate directly to the product lot where transaction occurred.</p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              {balances.length} Pending Records
            </span>
          </div>

          <Table
            columns={columns}
            data={balances}
            onRowClick={(row) => navigate(`/goods/${row.goods_id}`)}
            emptyMessage="No pending customer balances found! All sales are 100% paid."
          />
        </div>
      )}

      {/* Collect / Settle Balance Modal */}
      {selectedSale && (
        <Modal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          title={`Collect Payment from ${selectedSale.sold_to}`}
        >
          <form onSubmit={handleSettleSubmit} className="space-y-4 text-slate-900">
            {settleError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                {settleError}
              </div>
            )}

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1.5 text-xs font-bold">
              <div className="flex justify-between text-slate-300">
                <span>Customer: <strong className="text-white">{selectedSale.sold_to}</strong></span>
                <span>Product: <strong className="text-white">{selectedSale.brand_name}</strong></span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Sale: <strong>₹{selectedSale.total_amount.toLocaleString('en-IN')}</strong></span>
                <span>Paid So Far: <strong className="text-emerald-400">₹{selectedSale.paid_amount.toLocaleString('en-IN')}</strong></span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800 font-black">
                <span className="text-rose-300">Current Balance Due:</span>
                <span className="text-base text-rose-400">₹{selectedSale.balance_due.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Amount Being Collected (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedSale.balance_due}
                value={settleData.amount_paid}
                onChange={(e) => setSettleData({ ...settleData, amount_paid: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
                Deposit Collected Funds To (Account Holder) *
              </label>
              <select
                value={settleData.account_holder_id}
                onChange={(e) => setSettleData({ ...settleData, account_holder_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
              >
                {accountHolders.map(ah => (
                  <option key={ah.id} value={ah.id} className="text-slate-900 bg-white font-bold">
                    {ah.name} (Current Balance: ₹{ah.current_balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={settleLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors"
              >
                {settleLoading ? 'Recording Payment...' : 'Confirm Payment & Update Balance'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
