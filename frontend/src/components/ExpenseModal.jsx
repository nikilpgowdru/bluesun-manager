import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createExpense, getAccountHolders } from '../api';

export default function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const [accountHolders, setAccountHolders] = useState([]);
  const [formData, setFormData] = useState({
    factory_name: 'Jeans',
    date: new Date().toISOString().split('T')[0],
    expense_description: '',
    amount: '',
    account_holder_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccountHolders();
    }
  }, [isOpen]);

  const fetchAccountHolders = async () => {
    try {
      const res = await getAccountHolders();
      setAccountHolders(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, account_holder_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching account holders:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(formData.amount);

    if (!formData.expense_description.trim()) {
      setError('Please provide an expense description.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (!formData.account_holder_id) {
      setError('Please select an Account Holder to deduct funds from.');
      return;
    }

    try {
      setLoading(true);
      await createExpense({
        ...formData,
        amount: amt,
        account_holder_id: parseInt(formData.account_holder_id),
      });
      onSuccess();
      onClose();
      // Reset
      setFormData({
        factory_name: 'Jeans',
        date: new Date().toISOString().split('T')[0],
        expense_description: '',
        amount: '',
        account_holder_id: accountHolders[0]?.id || '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Manual Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Factory *
            </label>
            <select
              value={formData.factory_name}
              onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Jeans">Jeans</option>
              <option value="Shirts">Shirts</option>
              <option value="Formals">Formals</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deduct From Account Holder *
          </label>
          <select
            value={formData.account_holder_id}
            onChange={(e) => setFormData({ ...formData, account_holder_id: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {accountHolders.map(ah => (
              <option key={ah.id} value={ah.id}>
                {ah.name} (Current Balance: ${ah.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Expense Description *
          </label>
          <input
            type="text"
            placeholder="e.g. Utility Bills / Machine Servicing / Extra Packaging"
            value={formData.expense_description}
            onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Amount ($) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="e.g. 1500.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Deducting & Saving...' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
