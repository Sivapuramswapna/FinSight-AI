import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineCurrencyDollar, HiOutlineTag, HiOutlineBell } from 'react-icons/hi';

const CATEGORIES = [
  'Housing & Rent',
  'Food & Dining',
  'Transportation',
  'Utilities & Subscriptions',
  'Shopping & Apparel',
  'Healthcare & Wellness',
  'Entertainment'
];

export default function BudgetModal({ isOpen, onClose, onSave, budget = null }) {
  const isEdit = Boolean(budget && budget.id);

  const [category, setCategory] = useState('Food & Dining');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (budget) {
      setCategory(budget.category || 'Food & Dining');
      setMonthlyLimit(budget.monthly_limit ? String(budget.monthly_limit) : '');
      setAlertThreshold(budget.alert_threshold ? String(budget.alert_threshold) : '80');
    } else {
      setCategory('Food & Dining');
      setMonthlyLimit('');
      setAlertThreshold('80');
    }
    setError('');
  }, [budget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please provide a valid monthly limit greater than $0.');
      return;
    }

    const threshold = parseFloat(alertThreshold);
    if (isNaN(threshold) || threshold < 10 || threshold > 100) {
      setError('Alert threshold must be between 10% and 100%.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        category,
        monthly_limit: limit,
        alert_threshold: threshold
      }, budget?.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save category budget.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-fintech-dark-border">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? `Edit ${budget.category} Budget` : 'Set New Category Budget'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define monthly spending caps and automated warning thresholds
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <div className="relative">
              <HiOutlineTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              <select
                disabled={isEdit}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white cursor-pointer disabled:opacity-60"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Limit ($) *
            </label>
            <div className="relative">
              <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="number"
                step="10"
                required
                placeholder="e.g. 500.00"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Warning Threshold */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Warning Threshold (%)
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {alertThreshold}%
              </span>
            </div>
            <div className="relative flex items-center gap-3">
              <HiOutlineBell className="text-slate-400 text-base shrink-0" />
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers warning indicator when category spending reaches {alertThreshold}% of limit.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
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
              className="btn btn-primary text-xs font-bold py-2 px-5 shadow-glow-indigo disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
