import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createGoods, updateGoods } from '../api';

export default function GoodsModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    batch_number: '',
    factory_name: 'Jeans',
    type: '',
    brand_name: '',
    manufacture_date: new Date().toISOString().split('T')[0],
    total_pcs: '',
    rejected_pcs: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        batch_number: initialData.batch_number || '',
        factory_name: initialData.factory_name || 'Jeans',
        type: initialData.type || '',
        brand_name: initialData.brand_name || '',
        manufacture_date: initialData.manufacture_date || new Date().toISOString().split('T')[0],
        total_pcs: initialData.total_pcs || '',
        rejected_pcs: initialData.rejected_pcs || 0,
      });
    } else {
      setFormData({
        batch_number: `BATCH-${Date.now().toString().slice(-6)}`,
        factory_name: 'Jeans',
        type: '',
        brand_name: '',
        manufacture_date: new Date().toISOString().split('T')[0],
        total_pcs: '',
        rejected_pcs: 0,
      });
    }
  }, [initialData, isOpen]);

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
      if (initialData) {
        await updateGoods(initialData.id, {
          ...formData,
          total_pcs: total,
          rejected_pcs: rejected,
        });
      } else {
        await createGoods({
          ...formData,
          total_pcs: total,
          rejected_pcs: rejected,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${initialData ? 'update' : 'create'} Goods record.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Production Goods" : "Add Production Goods"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Batch Number *
          </label>
          <input
            type="text"
            placeholder="e.g. BATCH-2026-001"
            value={formData.batch_number}
            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Factory Category *
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
            Type *
          </label>
          <input
            type="text"
            placeholder="e.g. Slim Fit Denim / Oxford Shirt"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Brand Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Bluesun Urban / Bluesun Royal"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Manufacture Date *
          </label>
          <input
            type="date"
            value={formData.manufacture_date}
            onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Total PCS *
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 1000"
              value={formData.total_pcs}
              onChange={(e) => setFormData({ ...formData, total_pcs: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Rejected PCS
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 25"
              value={formData.rejected_pcs}
              onChange={(e) => setFormData({ ...formData, rejected_pcs: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
            />
          </div>
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
            {loading ? 'Saving...' : (initialData ? 'Update Goods' : 'Save Production Goods')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
