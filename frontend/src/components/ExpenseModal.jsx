import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createExpense, updateExpense, getAccountHolders } from '../api';

export default function ExpenseModal({ isOpen, onClose, onSuccess, initialData = null }) {
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        factory_name: initialData.factory_name || 'Jeans',
        date: initialData.date || new Date().toISOString().split('T')[0],
        expense_description: initialData.expense_description || '',
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        account_holder_id: initialData.account_holder_id || '',
      });
    } else {
      setFormData({
        factory_name: 'Jeans',
        date: new Date().toISOString().split('T')[0],
        expense_description: '',
        amount: '',
        account_holder_id: accountHolders[0]?.id || '',
      });
    }
  }, [initialData, isOpen, accountHolders]);

  const fetchAccountHolders = async () => {
    try {
      const res = await getAccountHolders();
      setAccountHolders(res.data);
      if (res.data.length > 0 && !formData.account_holder_id) {
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

    try {
      setLoading(true);
      if (initialData) {
        await updateExpense(initialData.id, {
          ...formData,
          amount: amt,
          account_holder_id: formData.account_holder_id ? parseInt(formData.account_holder_id) : null,
        });
      } else {
        await createExpense({
          ...formData,
          amount: amt,
          account_holder_id: parseInt(formData.account_holder_id),
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${initialData ? 'update' : 'record'} expense.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Manual Expense" : "Record Manual Expense"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Factory *
            </label>
            <select
              value={formData.factory_name}
              onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
            >
              <option value="Jeans" className="text-slate-900 bg-white font-bold">Jeans</option>
              <option value="Shirts" className="text-slate-900 bg-white font-bold">Shirts</option>
              <option value="Formals" className="text-slate-900 bg-white font-bold">Formals</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Deduct From Account Holder *
          </label>
          <select
            value={formData.account_holder_id}
            onChange={(e) => setFormData({ ...formData, account_holder_id: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
          >
            {accountHolders.map(ah => (
              <option key={ah.id} value={ah.id} className="text-slate-900 bg-white font-bold">
                {ah.name} (Current Balance: ₹{ah.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Expense Description *
          </label>
          <input
            type="text"
            placeholder="e.g. Utility Bills / Machine Servicing / Extra Packaging"
            value={formData.expense_description}
            onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Amount (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="e.g. 15000.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
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
            className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (initialData ? 'Update Expense' : 'Record Expense')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
