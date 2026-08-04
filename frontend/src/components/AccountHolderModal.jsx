import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createAccountHolder, updateAccountHolder } from '../api';

export default function AccountHolderModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    current_balance: '0',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        current_balance: initialData.current_balance !== undefined ? String(initialData.current_balance) : '0',
      });
    } else {
      setFormData({ name: '', current_balance: '0' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const balance = parseFloat(formData.current_balance) || 0;

    if (!formData.name.trim()) {
      setError('Please provide an Account Holder name.');
      return;
    }

    try {
      setLoading(true);
      if (initialData) {
        await updateAccountHolder(initialData.id, {
          name: formData.name,
          current_balance: balance,
        });
      } else {
        await createAccountHolder({
          name: formData.name,
          current_balance: balance,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${initialData ? 'update' : 'create'} Account Holder.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Account Holder" : "Add New Account Holder"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Account Holder Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Main Corporate Account / Factory Reserve"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Current Balance (₹)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.current_balance}
            onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
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
            {loading ? 'Saving...' : (initialData ? 'Update Account Holder' : 'Create Account Holder')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
