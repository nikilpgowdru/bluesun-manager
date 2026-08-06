import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createSale, updateSale, getAccountHolders, createAccountHolder } from '../api';
import { Plus, UserPlus, Search, Trash2, Split } from 'lucide-react';

export default function SaleModal({ isOpen, onClose, goodsId, availablePcs, onSuccess, initialData = null }) {
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
    payment_status: 'Paid', // 'Paid', 'Pending', 'Partial'
    paid_amount: '',
  });

  const [gstOption, setGstOption] = useState('none'); // 'none', '5', '12', '18', '28', 'custom'
  const [customGstAmount, setCustomGstAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Multi-Account Split Deposit States
  const [depositMode, setDepositMode] = useState('single'); // 'single' or 'split'
  const [allocations, setAllocations] = useState([
    { account_holder_id: '', amount: '' },
    { account_holder_id: '', amount: '' },
  ]);

  // Inline Account Holder creation & search states
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountLoading, setNewAccountLoading] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAccountHolders();
      if (initialData) {
        setFormData({
          date: initialData.date || new Date().toISOString().split('T')[0],
          sold_to: initialData.sold_to || '',
          quantity: initialData.quantity || '',
          price: initialData.price || '',
          receipt: initialData.receipt || `REC-${Date.now().toString().slice(-6)}`,
          receiver: initialData.receiver || 'Saving',
          account_holder_id: initialData.account_holder_id || '',
          expense_description: initialData.expense_description || '',
          payment_status: initialData.payment_status || 'Paid',
          paid_amount: initialData.paid_amount !== undefined ? initialData.paid_amount : '',
        });
        setDepositMode('single');
        if (initialData.gst_amount > 0 && (!initialData.gst_percent || initialData.gst_percent === 0)) {
          setGstOption('custom');
          setCustomGstAmount(initialData.gst_amount);
        } else if (initialData.gst_percent > 0) {
          setGstOption(initialData.gst_percent.toString());
        } else {
          setGstOption('none');
        }
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          sold_to: '',
          quantity: '',
          price: '',
          receipt: `REC-${Date.now().toString().slice(-6)}`,
          receiver: 'Saving',
          account_holder_id: '',
          expense_description: '',
          payment_status: 'Paid',
          paid_amount: '',
        });
        setDepositMode('single');
        setAllocations([
          { account_holder_id: '', amount: '' },
          { account_holder_id: '', amount: '' },
        ]);
        setGstOption('none');
        setCustomGstAmount('');
      }
    }
  }, [isOpen, initialData]);

  const fetchAccountHolders = async () => {
    try {
      const res = await getAccountHolders();
      setAccountHolders(res.data);
      if (res.data.length > 0) {
        if (!formData.account_holder_id) {
          setFormData(prev => ({ ...prev, account_holder_id: res.data[0].id }));
        }
        setAllocations(prev => prev.map((a, idx) => ({
          ...a,
          account_holder_id: a.account_holder_id || res.data[Math.min(idx, res.data.length - 1)]?.id || ''
        })));
      }
    } catch (err) {
      console.error('Error fetching account holders:', err);
    }
  };

  const handleCreateNewAccountHolder = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    try {
      setNewAccountLoading(true);
      const res = await createAccountHolder({ name: newAccountName.trim(), current_balance: 0 });
      setAccountHolders(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, account_holder_id: res.data.id }));
      setNewAccountName('');
      setShowNewAccountForm(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create new account holder.');
    } finally {
      setNewAccountLoading(false);
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

  let calculatedPaidAmount = finalTotal;
  let calculatedBalanceDue = 0;

  if (formData.payment_status === 'Pending') {
    calculatedPaidAmount = 0;
    calculatedBalanceDue = finalTotal;
  } else if (formData.payment_status === 'Partial') {
    calculatedPaidAmount = parseFloat(formData.paid_amount) || 0;
    calculatedBalanceDue = Math.max(0, finalTotal - calculatedPaidAmount);
  }

  const handleAddAllocation = () => {
    const defaultId = accountHolders.length > 0 ? accountHolders[Math.min(allocations.length, accountHolders.length - 1)]?.id : '';
    setAllocations([...allocations, { account_holder_id: defaultId, amount: '' }]);
  };

  const handleRemoveAllocation = (index) => {
    if (allocations.length <= 1) return;
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...allocations];
    newAllocations[index][field] = value;
    setAllocations(newAllocations);
  };

  const handleAutoFillRemaining = (index) => {
    const otherSum = allocations.reduce((sum, a, i) => i === index ? sum : sum + (parseFloat(a.amount) || 0), 0);
    const remaining = Math.max(0, calculatedPaidAmount - otherSum);
    handleAllocationChange(index, 'amount', remaining.toFixed(2));
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

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
    const maxQty = initialData ? (availablePcs + initialData.quantity) : availablePcs;
    if (qty > maxQty) {
      setError(`Quantity cannot exceed available stock (${maxQty} PCS).`);
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    let finalAllocations = null;

    if (formData.receiver === 'Saving') {
      if (depositMode === 'split') {
        if (calculatedPaidAmount > 0) {
          for (let i = 0; i < allocations.length; i++) {
            const alloc = allocations[i];
            if (!alloc.account_holder_id) {
              setError(`Please select an Account Holder for row #${i + 1}.`);
              return;
            }
            if (isNaN(parseFloat(alloc.amount)) || parseFloat(alloc.amount) <= 0) {
              setError(`Please enter a valid deposit amount for row #${i + 1}.`);
              return;
            }
          }
          if (Math.abs(totalAllocated - calculatedPaidAmount) > 0.05) {
            setError(`Total split deposits (₹${totalAllocated.toFixed(2)}) must equal amount received (₹${calculatedPaidAmount.toFixed(2)}).`);
            return;
          }
          finalAllocations = allocations.map(a => ({
            account_holder_id: parseInt(a.account_holder_id),
            amount: parseFloat(a.amount)
          }));
        }
      } else {
        if (!formData.account_holder_id) {
          setError('Please select an Account Holder for Saving.');
          return;
        }
      }
    }

    if (formData.receiver === 'Expense' && !formData.expense_description.trim()) {
      setError('Please provide an Expense Description.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        quantity: qty,
        price: priceVal,
        gst_percent: gstPercent,
        gst_amount: gstAmount,
        payment_status: formData.payment_status,
        paid_amount: calculatedPaidAmount,
        balance_due: calculatedBalanceDue,
        account_holder_id: (formData.receiver === 'Saving' && depositMode === 'single') ? parseInt(formData.account_holder_id) : null,
        account_allocations: (formData.receiver === 'Saving' && depositMode === 'split') ? finalAllocations : null,
        expense_description: formData.receiver === 'Expense' ? formData.expense_description : null,
      };

      if (initialData) {
        await updateSale(initialData.id, payload);
      } else {
        await createSale(goodsId, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Sale Record" : "Add Sale Record"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Financial Summary Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
            <span>Stock Available: <strong className="text-white">{availablePcs} PCS</strong></span>
            <span>Subtotal: <strong className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-300 border-t border-slate-800 pt-1.5 font-bold">
            <span>GST ({gstOption === 'custom' ? 'Custom ₹' : `${gstPercent}%`}):</span>
            <span className="font-extrabold text-amber-400">+₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700 font-extrabold">
            <span className="text-slate-200">Final Total Earnings:</span>
            <strong className="text-lg font-black text-emerald-400">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          
          {/* Payment Status Summary */}
          {formData.payment_status !== 'Paid' && (
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800 font-bold text-amber-300">
              <span>Paid Amount: ₹{calculatedPaidAmount.toLocaleString('en-IN')}</span>
              <span>Balance Due (Pay Later): <strong className="text-rose-400">₹{calculatedBalanceDue.toLocaleString('en-IN')}</strong></span>
            </div>
          )}
        </div>

        {/* Payment Status Selection (Pay Later / Balance Option) */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Payment Mode & Customer Balance (Pay Later Option) *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Paid', label: 'Full Paid (₹)', color: 'blue' },
              { id: 'Pending', label: 'Pay Later (Balance)', color: 'rose' },
              { id: 'Partial', label: 'Partial Payment', color: 'amber' },
            ].map(status => (
              <button
                key={status.id}
                type="button"
                onClick={() => setFormData({ ...formData, payment_status: status.id })}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                  formData.payment_status === status.id
                    ? status.id === 'Paid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : status.id === 'Pending'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {formData.payment_status === 'Partial' && (
            <div className="pt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                  Amount Paid Now (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={finalTotal}
                  placeholder="e.g. 2000"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                  Remaining Balance Due (₹)
                </label>
                <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-rose-50 text-rose-700 font-black text-sm">
                  ₹{calculatedBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}
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
              max={initialData ? (availablePcs + initialData.quantity) : availablePcs}
              placeholder="Quantity"
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
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Account Deposit Mode *
              </label>
              <button
                type="button"
                onClick={() => setShowNewAccountForm(!showNewAccountForm)}
                className="text-xs font-extrabold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showNewAccountForm ? 'Close' : '+ Add New Account'}
              </button>
            </div>

            {showNewAccountForm && (
              <div className="p-3 bg-white rounded-xl border border-blue-300 shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-slate-900 block">Create & Select New Account Holder</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Account Name (e.g. HDFC Bank, Cash Counter)"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
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

            {/* Deposit Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDepositMode('single')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                  depositMode === 'single'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Single Account Deposit
              </button>
              <button
                type="button"
                onClick={() => setDepositMode('split')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                  depositMode === 'split'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                Split Across Accounts (+3)
              </button>
            </div>

            {depositMode === 'single' ? (
              <div>
                {accountHolders.length > 5 && (
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter account holders..."
                      value={accountSearchQuery}
                      onChange={(e) => setAccountSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                    />
                  </div>
                )}
                <select
                  value={formData.account_holder_id}
                  onChange={(e) => setFormData({ ...formData, account_holder_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                >
                  {accountHolders
                    .filter(ah => ah.name.toLowerCase().includes(accountSearchQuery.toLowerCase()))
                    .map(ah => (
                      <option key={ah.id} value={ah.id} className="text-slate-900 bg-white font-bold">
                        {ah.name} (Current: ₹{ah.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              /* Multi-Account Split Rows */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                  <span>Allocate Amounts to Multiple Accounts:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                    Math.abs(totalAllocated - calculatedPaidAmount) < 0.05
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold'
                      : 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                  }`}>
                    Allocated: ₹{totalAllocated.toFixed(2)} / Required: ₹{calculatedPaidAmount.toFixed(2)}
                  </span>
                </div>

                {allocations.map((alloc, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700 uppercase">Account #{idx + 1}</span>
                      {allocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocation(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Remove Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={alloc.account_holder_id}
                        onChange={(e) => handleAllocationChange(idx, 'account_holder_id', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-bold bg-white text-xs"
                      >
                        <option value="">Select Account Holder</option>
                        {accountHolders.map(ah => (
                          <option key={ah.id} value={ah.id} className="text-slate-900 bg-white font-bold">
                            {ah.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount ₹"
                          value={alloc.amount}
                          onChange={(e) => handleAllocationChange(idx, 'amount', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-bold bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAutoFillRemaining(idx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold border border-slate-300"
                          title="Auto Fill Remaining Balance"
                        >
                          Fill Rem.
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddAllocation}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Another Account Deposit (3+ Accounts)
                </button>
              </div>
            )}
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
            {loading ? 'Saving...' : initialData ? 'Update Sale' : 'Save & Confirm Sale'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
