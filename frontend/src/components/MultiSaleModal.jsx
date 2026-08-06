import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getGoods, getAccountHolders, createAccountHolder, createMultiItemSale } from '../api';
import { Plus, Trash2, UserPlus, Search, ShoppingBag } from 'lucide-react';

export default function MultiSaleModal({ isOpen, onClose, onSuccess }) {
  const [goodsList, setGoodsList] = useState([]);
  const [accountHolders, setAccountHolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Main Form Data
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [soldTo, setSoldTo] = useState('');
  const [receipt, setReceipt] = useState(`REC-${Date.now().toString().slice(-6)}`);
  
  // Selected Garment Items
  const [items, setItems] = useState([
    { goods_id: '', quantity: '', price: '' }
  ]);

  // Tax & Payment States
  const [gstOption, setGstOption] = useState('none');
  const [customGstAmount, setCustomGstAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // 'Paid', 'Pending', 'Partial'
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [receiver, setReceiver] = useState('Saving'); // 'Saving' or 'Expense'
  const [accountHolderId, setAccountHolderId] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Inline Account creation & Search
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountLoading, setNewAccountLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      setReceipt(`REC-${Date.now().toString().slice(-6)}`);
      setDate(new Date().toISOString().split('T')[0]);
      setSoldTo('');
      setItems([{ goods_id: '', quantity: '', price: '' }]);
      setGstOption('none');
      setCustomGstAmount('');
      setPaymentStatus('Paid');
      setPaidAmountInput('');
      setReceiver('Saving');
      setError('');
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [goodsRes, ahRes] = await Promise.all([
        getGoods('All', 'All', 'All'),
        getAccountHolders()
      ]);
      const availableGoods = goodsRes.data.filter(g => g.available_pcs > 0);
      setGoodsList(availableGoods);
      setAccountHolders(ahRes.data);
      if (ahRes.data.length > 0) {
        setAccountHolderId(ahRes.data[0].id);
      }
      if (availableGoods.length > 0) {
        setItems([{ goods_id: availableGoods[0].id.toString(), quantity: '1', price: '' }]);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const firstAvailable = goodsList.length > 0 ? goodsList[0].id.toString() : '';
    setItems([...items, { goods_id: firstAvailable, quantity: '1', price: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleCreateNewAccountHolder = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    try {
      setNewAccountLoading(true);
      const res = await createAccountHolder({ name: newAccountName.trim(), current_balance: 0 });
      setAccountHolders(prev => [...prev, res.data]);
      setAccountHolderId(res.data.id);
      setNewAccountName('');
      setShowNewAccountForm(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create new account holder.');
    } finally {
      setNewAccountLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => {
    const q = parseInt(item.quantity) || 0;
    const p = parseFloat(item.price) || 0;
    return sum + (q * p);
  }, 0);

  let gstPercent = 0;
  let gstAmount = 0;

  if (gstOption === 'custom') {
    gstAmount = parseFloat(customGstAmount) || 0;
  } else if (gstOption !== 'none') {
    gstPercent = parseFloat(gstOption) || 0;
    gstAmount = (subtotal * gstPercent) / 100;
  }

  const grandTotal = subtotal + gstAmount;

  let calculatedPaidAmount = grandTotal;
  let calculatedBalanceDue = 0;

  if (paymentStatus === 'Pending') {
    calculatedPaidAmount = 0;
    calculatedBalanceDue = grandTotal;
  } else if (paymentStatus === 'Partial') {
    calculatedPaidAmount = parseFloat(paidAmountInput) || 0;
    calculatedBalanceDue = Math.max(0, grandTotal - calculatedPaidAmount);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!soldTo.trim() || !receipt.trim()) {
      setError('Please provide Customer Name and Receipt Number.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least 1 garment item.');
      return;
    }

    const itemPayloads = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.goods_id) {
        setError(`Please select a garment batch for Item #${i + 1}.`);
        return;
      }
      const q = parseInt(it.quantity);
      const p = parseFloat(it.price);
      if (isNaN(q) || q <= 0) {
        setError(`Quantity for Item #${i + 1} must be greater than 0.`);
        return;
      }
      if (isNaN(p) || p <= 0) {
        setError(`Unit Price for Item #${i + 1} must be greater than 0.`);
        return;
      }

      const selectedGoods = goodsList.find(g => g.id.toString() === it.goods_id.toString());
      if (selectedGoods && q > selectedGoods.available_pcs) {
        setError(`Quantity (${q}) for ${selectedGoods.brand_name} exceeds stock (${selectedGoods.available_pcs} PCS).`);
        return;
      }

      itemPayloads.push({
        goods_id: parseInt(it.goods_id),
        quantity: q,
        price: p
      });
    }

    if (receiver === 'Saving' && !accountHolderId) {
      setError('Please select an Account Holder to deposit funds.');
      return;
    }

    if (receiver === 'Expense' && !expenseDesc.trim()) {
      setError('Please provide an Expense Description.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        date,
        sold_to: soldTo.trim(),
        receipt: receipt.trim(),
        items: itemPayloads,
        gst_percent: gstPercent,
        gst_amount: gstAmount,
        payment_status: paymentStatus,
        paid_amount: calculatedPaidAmount,
        receiver,
        account_holder_id: receiver === 'Saving' ? parseInt(accountHolderId) : null,
        expense_description: receiver === 'Expense' ? expenseDesc.trim() : null
      };

      await createMultiItemSale(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record multi-item sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Multi-Item Sales Checkout">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
            <span>Items Selected: <strong className="text-white">{items.length} Lines</strong></span>
            <span>Subtotal: <strong className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-300 border-t border-slate-800 pt-1.5 font-bold">
            <span>GST ({gstOption === 'custom' ? 'Custom ₹' : `${gstPercent}%`}):</span>
            <span className="font-extrabold text-amber-400">+₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700 font-extrabold">
            <span className="text-slate-200">Grand Total Receipt:</span>
            <strong className="text-lg font-black text-emerald-400">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Receipt # *</label>
            <input
              type="text"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Customer Name *</label>
            <input
              type="text"
              placeholder="e.g. Royal Fashions"
              value={soldTo}
              onChange={(e) => setSoldTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
            />
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              Select Garment Batches & Quantities
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add Garment Line
            </button>
          </div>

          {items.map((item, idx) => {
            const currentGoods = goodsList.find(g => g.id.toString() === item.goods_id.toString());
            return (
              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                  <span>Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-0.5">Garment Batch / Stock *</label>
                    <select
                      value={item.goods_id}
                      onChange={(e) => handleItemChange(idx, 'goods_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold text-xs bg-white"
                    >
                      <option value="">Select Garment Stock</option>
                      {goodsList.map(g => (
                        <option key={g.id} value={g.id}>
                          [{g.factory_name}] {g.brand_name} ({g.type}) - Batch: {g.batch_number} (Avail: {g.available_pcs} PCS)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-0.5">Quantity (PCS) *</label>
                    <input
                      type="number"
                      min="1"
                      max={currentGoods ? currentGoods.available_pcs : 99999}
                      placeholder="e.g. 10"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-0.5">Unit Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 450"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="block text-xs font-extrabold text-slate-900 uppercase">
            GST Tax Option
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
                className={`py-1.5 px-2 rounded-xl text-xs font-extrabold border transition-all ${
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
            <div className="pt-1">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter custom GST amount ₹"
                value={customGstAmount}
                onChange={(e) => setCustomGstAmount(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
              />
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
          <label className="block text-xs font-extrabold text-slate-900 uppercase">
            Payment Mode & Customer Balance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Paid', label: 'Full Paid (₹)' },
              { id: 'Pending', label: 'Pay Later (Balance)' },
              { id: 'Partial', label: 'Partial Payment' },
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setPaymentStatus(st.id)}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                  paymentStatus === st.id
                    ? st.id === 'Paid'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : st.id === 'Pending'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {paymentStatus === 'Partial' && (
            <div className="pt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Amount Paid Now (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={grandTotal}
                  placeholder="e.g. 2000"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 uppercase mb-1">Remaining Balance (₹)</label>
                <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-rose-50 text-rose-700 font-black text-xs">
                  ₹{calculatedBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold text-slate-900 uppercase">Account Deposit *</label>
            {receiver === 'Saving' && (
              <button
                type="button"
                onClick={() => setShowNewAccountForm(!showNewAccountForm)}
                className="text-xs font-extrabold text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showNewAccountForm ? 'Close' : '+ Add New Account'}
              </button>
            )}
          </div>

          {showNewAccountForm && (
            <div className="p-2.5 bg-white rounded-xl border border-blue-300 space-y-2">
              <span className="text-xs font-extrabold text-slate-900 block">Create New Account Holder</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Account Name (e.g. HDFC Bank, Cash Counter)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleCreateNewAccountHolder}
                  disabled={newAccountLoading || !newAccountName.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-extrabold hover:bg-blue-700 disabled:opacity-50"
                >
                  {newAccountLoading ? 'Creating...' : 'Save & Select'}
                </button>
              </div>
            </div>
          )}

          <select
            value={accountHolderId}
            onChange={(e) => setAccountHolderId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-xs"
          >
            {accountHolders.map(ah => (
              <option key={ah.id} value={ah.id}>
                {ah.name} (Current Balance: ₹{ah.current_balance.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md disabled:opacity-50"
          >
            {loading ? 'Processing Multi-Sale...' : 'Confirm & Complete Multi-Sale'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
