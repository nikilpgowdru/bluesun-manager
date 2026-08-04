import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createSale, getAccountHolders } from '../api';

export default function SaleModal({ isOpen, onClose, goodsId, availablePcs, onSuccess }) {
  const [accountHolders, setAccountHolders] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sold_to: '',
    quantity: '',
    price: '',
    receipt: `REC-${Date.now().toString().slice(-6)}`,
    receiver: 'Saving',
    account_holder_id: '',
    expense_description: '',
  });

  const [gstOption, setGstOption] = useState('none'); // 'none', '5', '12', '18', '28', 'custom'
  const [customGstAmount, setCustomGstAmount] = useState('');
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

  const subtotal = (parseInt(formData.quantity) || 0) * (parseFloat(formData.price) || 0);

  let gstPercent = 0;
  let gstAmount = 0;

  if (gstOption === 'custom') {
    gstAmount = parseFloat(customGstAmount) || 0;
  } else if (gstOption !== 'none') {
    gstPercent = parseFloat(gstOption) || 0;
    gstAmount = (subtotal * gstPercent) / 100;
  }

  const finalTotal = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(formData.quantity);
    const priceVal = parseFloat(formData.price);

    if (!formData.sold_to.trim() || !formData.receipt.trim()) {
      setError('Please fill in all required text fields.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (qty > availablePcs) {
      setError(`Quantity cannot exceed available stock (${availablePcs} PCS).`);
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    if (formData.receiver === 'Saving' && !formData.account_holder_id) {
      setError('Please select an Account Holder for Saving.');
      return;
    }

    if (formData.receiver === 'Expense' && !formData.expense_description.trim()) {
      setError('Please provide an Expense Description.');
      return;
    }

    try {
      setLoading(true);
      await createSale(goodsId, {
        ...formData,
        quantity: qty,
        price: priceVal,
        gst_percent: gstPercent,
        gst_amount: gstAmount,
        account_holder_id: formData.receiver === 'Saving' ? parseInt(formData.account_holder_id) : null,
        expense_description: formData.receiver === 'Expense' ? formData.expense_description : null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Sale Record">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Financial Summary Banner */}
        <div className="bg-blue-50/90 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 font-bold space-y-1.5">
          <div className="flex justify-between items-center text-slate-700">
            <span>Stock Available: <strong>{availablePcs} PCS</strong></span>
            <span>Subtotal: <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
          </div>
          <div className="flex justify-between items-center text-slate-700 border-t border-blue-200/60 pt-1.5">
            <span>GST ({gstOption === 'custom' ? 'Custom ₹' : `${gstPercent}%`}):</span>
            <span className="font-extrabold text-amber-700">+₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-1.5 border-t border-blue-300">
            <span className="font-extrabold text-slate-900">Final Total Earnings:</span>
            <strong className="text-base font-black text-blue-700">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Receipt / Invoice *
            </label>
            <input
              type="text"
              placeholder="e.g. REC-2026-101"
              value={formData.receipt}
              onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Sold To (Customer Name) *
          </label>
          <input
            type="text"
            placeholder="e.g. Metro Fashion Hub"
            value={formData.sold_to}
            onChange={(e) => setFormData({ ...formData, sold_to: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Quantity (PCS) *
            </label>
            <input
              type="number"
              min="1"
              max={availablePcs}
              placeholder={`Max ${availablePcs}`}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Unit Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 450.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* GST Option Section */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            GST Tax Option (Optional / Direct Cost)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'No GST (0%)' },
              { id: '5', label: 'GST 5%' },
              { id: '12', label: 'GST 12%' },
              { id: '18', label: 'GST 18%' },
              { id: '28', label: 'GST 28%' },
              { id: 'custom', label: 'Custom GST ₹' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGstOption(opt.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                  gstOption === opt.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {gstOption === 'custom' && (
            <div className="pt-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                Enter Direct GST Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 500.00"
                value={customGstAmount}
                onChange={(e) => setCustomGstAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Receiver Option *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, receiver: 'Saving' })}
              className={`py-2.5 px-4 rounded-xl text-xs font-extrabold border transition-all ${
                formData.receiver === 'Saving'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Saving (Deposit to Account)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, receiver: 'Expense' })}
              className={`py-2.5 px-4 rounded-xl text-xs font-extrabold border transition-all ${
                formData.receiver === 'Expense'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Expense (Factory Cost)
            </button>
          </div>
        </div>

        {formData.receiver === 'Saving' && (
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Account Holder *
            </label>
            <select
              value={formData.account_holder_id}
              onChange={(e) => setFormData({ ...formData, account_holder_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              {accountHolders.map(ah => (
                <option key={ah.id} value={ah.id} className="text-slate-900 bg-white font-bold">
                  {ah.name} (Current: ₹{ah.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.receiver === 'Expense' && (
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              Expense Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Raw Material Cost / Labor & Thread Purchase"
              value={formData.expense_description}
              onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs placeholder:text-slate-400"
            />
          </div>
        )}

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
            {loading ? 'Processing Sale...' : 'Save & Confirm Sale'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
