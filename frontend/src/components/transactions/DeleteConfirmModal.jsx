import React, { useState } from 'react';
import { HiOutlineExclamation, HiOutlineX } from 'react-icons/hi';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, transaction }) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(transaction.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-fintech-dark-border">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <HiOutlineExclamation size={20} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Transaction</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-fintech-dark-hover"
          >
            <HiOutlineX size={18} />
          </button>
        </div>

        <div className="py-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-white">{transaction.description}</p>
            <p className="text-slate-500">{transaction.merchant || 'No merchant'} • ${transaction.amount?.toFixed(2)} • {transaction.date}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
