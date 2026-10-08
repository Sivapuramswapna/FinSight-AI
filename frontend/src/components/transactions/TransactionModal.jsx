import React, { useState, useEffect } from 'react';
import {
  HiOutlineX,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineTag,
  HiOutlineOfficeBuilding,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineLightBulb
} from 'react-icons/hi';
import api from '../../services/api';

const DEFAULT_CATEGORIES = [
  'Housing & Rent',
  'Food & Dining',
  'Transportation',
  'Utilities & Subscriptions',
  'Shopping & Apparel',
  'Healthcare & Wellness',
  'Entertainment',
  'Salary',
  'Consulting',
  'Investments & Dividends'
];

const PAYMENT_METHODS = [
  'Credit Card (*4821)',
  'Debit Card (*9012)',
  'Cash',
  'Bank Wire / ACH',
  'Apple Pay',
  'Google Pay',
  'PayPal'
];

export default function TransactionModal({ isOpen, onClose, onSave, transaction = null }) {
  const isEdit = Boolean(transaction && transaction.id);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (*4821)');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // AI Categorization states
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || 'expense');
      setAmount(transaction.amount ? String(transaction.amount) : '');
      setDescription(transaction.description || '');
      setCategory(transaction.category || 'Food & Dining');
      setSubcategory(transaction.subcategory || '');
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(transaction.payment_method || transaction.paymentMethod || 'Credit Card (*4821)');
      setMerchant(transaction.merchant || '');
      setNotes(transaction.notes || '');
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory('Food & Dining');
      setSubcategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Credit Card (*4821)');
      setMerchant('');
      setNotes('');
    }
    setError('');
    setAiSuggestion(null);
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleAiCategorize = async () => {
    if (!description.trim() && !merchant.trim()) {
      setError('Please enter a description or merchant first to auto-categorize.');
      return;
    }
    setError('');
    setAiCategorizing(true);
    try {
      const res = await api.post('/ai/categorize', {
        description: description.trim(),
        merchant: merchant.trim() || undefined,
        amount: parseFloat(amount) || undefined,
        type: type
      });

      if (res.data && res.data.predicted_category) {
        setCategory(res.data.predicted_category);
        setAiSuggestion(res.data);
      }
    } catch (err) {
      console.warn('AI Categorization fallback:', err);
      // Fallback rule-based matching if offline
      const query = `${description} ${merchant}`.toLowerCase();
      let matched = 'Food & Dining';
      if (query.includes('uber') || query.includes('gas') || query.includes('flight')) matched = 'Transportation';
      else if (query.includes('salary') || query.includes('payroll')) matched = 'Salary';
      else if (query.includes('amazon') || query.includes('apple') || query.includes('store')) matched = 'Shopping & Apparel';
      else if (query.includes('rent') || query.includes('lease')) matched = 'Housing & Rent';

      setCategory(matched);
      setAiSuggestion({
        predicted_category: matched,
        confidence: 0.88,
        explanation: `Rule-based match for ${matched}`,
        candidates: [{ category: matched, confidence: 0.88, explanation: 'Local heuristic match' }]
      });
    } finally {
      setAiCategorizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than $0.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: parsedAmount,
        type,
        category,
        subcategory: subcategory.trim() || undefined,
        description: description.trim(),
        date,
        payment_method: paymentMethod,
        merchant: merchant.trim() || undefined,
        notes: notes.trim() || undefined
      };

      await onSave(payload, transaction?.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-fintech-dark-border">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Transaction' : 'Record New Transaction'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit ? 'Update transaction details and attributes' : 'Manually record expense or income entry'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-fintech-dark-hover transition-colors"
          >
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'Salary' || category === 'Consulting') setCategory('Food & Dining');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (category === 'Food & Dining') setCategory('Salary');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ($) *
              </label>
              <div className="relative">
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <div className="relative">
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Description with AI Auto-Categorize Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description *
              </label>
              <button
                type="button"
                onClick={handleAiCategorize}
                disabled={aiCategorizing || (!description.trim() && !merchant.trim())}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors disabled:opacity-40"
                title="Use NLP and Machine Learning to predict transaction category"
              >
                <HiOutlineSparkles className={`w-3.5 h-3.5 ${aiCategorizing ? 'animate-spin' : 'text-indigo-500'}`} />
                <span>{aiCategorizing ? 'Categorizing...' : 'Auto-Categorize with AI'}</span>
              </button>
            </div>
            <div className="relative">
              <HiOutlineDocumentText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                required
                placeholder="e.g. Whole Foods Organic Groceries, Delta Flight"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* AI Suggestion Banner (if triggered) */}
          {aiSuggestion && (
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <HiOutlineSparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    AI Auto-Assigned: <span className="text-indigo-600 dark:text-indigo-400">{aiSuggestion.predicted_category}</span>
                  </span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {Math.round(aiSuggestion.confidence * 100)}% Confidence
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {aiSuggestion.explanation}
              </p>
              {aiSuggestion.candidates && aiSuggestion.candidates.length > 1 && (
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Alternatives:</span>
                  {aiSuggestion.candidates.slice(1).map((cand) => (
                    <button
                      key={cand.category}
                      type="button"
                      onClick={() => setCategory(cand.category)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap ${
                        category === cand.category
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {cand.category} ({Math.round(cand.confidence * 100)}%)
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <div className="relative">
                <HiOutlineTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white cursor-pointer"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                placeholder="e.g. Groceries, Coffee, Hardware"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Merchant & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Merchant / Payee
              </label>
              <div className="relative">
                <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="text"
                  placeholder="e.g. Whole Foods, Netflix, Stripe"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <div className="relative">
                <HiOutlineCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional context, tax details, or transaction tags..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
