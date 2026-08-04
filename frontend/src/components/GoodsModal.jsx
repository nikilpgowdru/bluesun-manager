import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createGoods, updateGoods } from '../api';

export default function GoodsModal({ isOpen, onClose, onSuccess, initialData = null }) {
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        factory_name: initialData.factory_name || 'Jeans',
        type: initialData.type || '',
        brand_name: initialData.brand_name || '',
        manufacture_date: initialData.manufacture_date || new Date().toISOString().split('T')[0],
        total_pcs: initialData.total_pcs || '',
        rejected_pcs: initialData.rejected_pcs || 0,
      });
    } else {
      setFormData({
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
      setError('Please fill in all required garment details.');
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
      setError(err.response?.data?.detail || `Failed to ${initialData ? 'update' : 'create'} Garment record.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Garment Collection" : "Add Garment Collection"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-200 font-semibold">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5">
            Apparel Factory Line *
          </label>
          <select
            value={formData.factory_name}
            onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-bold bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Jeans">👖 Jeans Line</option>
            <option value="Shirts">👔 Shirts Line</option>
            <option value="Formals">🧥 Formals Line</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5">
            Garment Type *
          </label>
          <input
            type="text"
            placeholder="e.g. Slim Fit Denim / Oxford Shirt / Tailored Suit"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5">
            Brand Collection Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Bluesun Royal Couture"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5">
            Manufacture Date *
          </label>
          <input
            type="date"
            value={formData.manufacture_date}
            onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5">
              Total PCS *
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 1000"
              value={formData.total_pcs}
              onChange={(e) => setFormData({ ...formData, total_pcs: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5">
              Rejected PCS
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 10"
              value={formData.rejected_pcs}
              onChange={(e) => setFormData({ ...formData, rejected_pcs: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all ring-1 ring-white/20"
          >
            {loading ? 'Saving...' : (initialData ? 'Update Collection' : 'Save Garment Collection')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
