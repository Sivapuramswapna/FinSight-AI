import React, { useState, useEffect } from 'react';
import {
  HiOutlineX,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineFlag,
  HiOutlineSparkles
} from 'react-icons/hi';

export default function GoalModal({ isOpen, onClose, onSave, onContribute, goal = null, mode = 'create' }) {
  const isContribute = mode === 'contribute';
  const isEdit = mode === 'edit';

  // Goal Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [status, setStatus] = useState('in_progress');

  // Contribution State
  const [contributionAmount, setContributionAmount] = useState('100');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setTargetAmount(goal.target_amount ? String(goal.target_amount) : '');
      setCurrentAmount(goal.current_amount ? String(goal.current_amount) : '0');
      setTargetDate(goal.target_date || '');
      setMonthlyContribution(goal.monthly_contribution ? String(goal.monthly_contribution) : '');
      setStatus(goal.status || 'in_progress');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setMonthlyContribution('');
      setStatus('in_progress');
    }
    setContributionAmount('100');
    setError('');
  }, [goal, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isContribute) {
      const amt = parseFloat(contributionAmount);
      if (isNaN(amt) || amt <= 0) {
        setError('Please enter a valid contribution amount greater than $0.');
        return;
      }
      setSubmitting(true);
      try {
        await onContribute(goal.id, amt);
        onClose();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to deposit contribution funds.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setError('Please provide a valid target amount.');
      return;
    }

    if (!name.trim()) {
      setError('Goal name is required.');
      return;
    }

    if (!targetDate) {
      setError('Target date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        target_amount: target,
        current_amount: parseFloat(currentAmount) || 0.0,
        target_date: targetDate,
        monthly_contribution: parseFloat(monthlyContribution) || 0.0,
        status
      };
      await onSave(payload, goal?.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save financial goal.');
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HiOutlineFlag className="text-indigo-500" />
              {isContribute
                ? `Contribute to ${goal?.name}`
                : isEdit
                ? 'Edit Savings Goal'
                : 'Create Savings Goal'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isContribute
                ? 'Allocate capital towards this target milestone'
                : 'Set target capital reserves and monthly deposits'}
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

          {isContribute ? (
            /* Contribute Funds Mode */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Current Saved:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${goal?.current_amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Target Milestone:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${goal?.target_amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold pt-1 border-t border-indigo-200/40 dark:border-indigo-800/40">
                  <span>Progress:</span>
                  <span>{goal?.percent_achieved}%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution Amount ($) *
                </label>
                <div className="relative">
                  <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                  <input
                    type="number"
                    step="10"
                    required
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-base rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Quick deposit chips */}
              <div className="flex items-center gap-2">
                {[50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setContributionAmount(String(preset))}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    +${preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Create / Edit Goal Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Car, Vacation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Goal ($) *
                  </label>
                  <div className="relative">
                    <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                      type="number"
                      step="50"
                      required
                      placeholder="10000.00"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Balance ($)
                  </label>
                  <div className="relative">
                    <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                      type="number"
                      step="50"
                      placeholder="0.00"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date *
                  </label>
                  <div className="relative">
                    <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Contribution ($)
                  </label>
                  <div className="relative">
                    <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                      type="number"
                      step="10"
                      placeholder="250.00"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
              {submitting
                ? 'Processing...'
                : isContribute
                ? 'Deposit Funds'
                : isEdit
                ? 'Update Goal'
                : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
