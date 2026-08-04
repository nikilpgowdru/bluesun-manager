import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { adjustAccountHolderBalance } from '../api';
import { PlusCircle, MinusCircle } from 'lucide-react';

export default function AccountBalanceModal({ isOpen, onClose, accountHolder, onSuccess }) {
  const [action, setAction] = useState('Deposit'); // 'Deposit' or 'Withdraw'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAction('Deposit');
      setAmount('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a reason / description for this adjustment.');
      return;
    }

    try {
      setLoading(true);
      await adjustAccountHolderBalance(accountHolder.id, {
        action,
        amount: amt,
        description: description.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to adjust account balance.');
    } finally {
      setLoading(false);
    }
  };

  if (!accountHolder) return null;

  const newBalancePreview = action === 'Deposit'
    ? (accountHolder.current_balance + (parseFloat(amount) || 0))
    : (accountHolder.current_balance - (parseFloat(amount) || 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Balance - ${accountHolder.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Current & Preview Banner */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold space-y-1">
          <div className="flex justify-between items-center text-slate-700">
            <span>Current Balance:</span>
            <strong className="text-sm font-extrabold text-slate-900">
              ₹{accountHolder.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex justify-between items-center text-slate-700 border-t border-slate-200 pt-1">
            <span>Adjustment:</span>
            <strong className={`font-extrabold ${action === 'Deposit' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {action === 'Deposit' ? '+' : '-'}₹{(parseFloat(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-300">
            <span className="font-extrabold text-slate-900">New Resulting Balance:</span>
            <strong className={`text-base font-black ${newBalancePreview >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
              ₹{newBalancePreview.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Action Toggle */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Select Operation *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('Deposit')}
              className={`py-3 px-4 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-2 transition-all ${
                action === 'Deposit'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Add Money (+ Deposit)
            </button>
            <button
              type="button"
              onClick={() => setAction('Withdraw')}
              className={`py-3 px-4 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-2 transition-all ${
                action === 'Withdraw'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Subtract Money (- Withdraw)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Amount (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="e.g. 5000.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Reason / Description *
          </label>
          <input
            type="text"
            placeholder="e.g. Capital Addition / Partner Withdrawal / Bank Transfer"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold text-white shadow-md transition-colors disabled:opacity-50 ${
              action === 'Deposit' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {loading ? 'Processing...' : (action === 'Deposit' ? 'Confirm Deposit (+)' : 'Confirm Withdrawal (-)')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
