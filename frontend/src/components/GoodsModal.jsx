import React, { useState } from 'react';
import Modal from './Modal';
import { createGoods } from '../api';

export default function GoodsModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    factory_name: 'Jeans',
    type: '',
    brand_name: '',
    manufacture_date: new Date().toISOString().split('T')[0],
    total_pcs: '',
    rejected_pcs: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const total = parseInt(formData.total_pcs);
    const rejected = parseInt(formData.rejected_pcs) || 0;

    if (!formData.type.trim() || !formData.brand_name.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isNaN(total) || total <= 0) {
      setError('Total PCS must be greater than 0.');
      return;
    }
    if (rejected < 0) {
      setError('Rejected PCS cannot be negative.');
      return;
    }
    if (rejected > total) {
      setError('Rejected PCS cannot exceed Total PCS.');
      return;
    }

    try {
      setLoading(true);
      await createGoods({
        ...formData,
        total_pcs: total,
        rejected_pcs: rejected,
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        factory_name: 'Jeans',
        type: '',
        brand_name: '',
        manufacture_date: new Date().toISOString().split('T')[0],
        total_pcs: '',
        rejected_pcs: 0,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create Goods record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Production Goods">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

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
            Type *
          </label>
          <input
            type="text"
            placeholder="e.g. Slim Fit Denim / Oxford Shirt"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Brand Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Bluesun Urban / Bluesun Royal"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Manufacture Date *
          </label>
          <input
            type="date"
            value={formData.manufacture_date}
            onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Total PCS *
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 1000"
              value={formData.total_pcs}
              onChange={(e) => setFormData({ ...formData, total_pcs: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rejected PCS
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 25"
              value={formData.rejected_pcs}
              onChange={(e) => setFormData({ ...formData, rejected_pcs: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
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
            {loading ? 'Saving...' : 'Save Production Goods'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
