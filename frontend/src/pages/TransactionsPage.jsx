import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineSwitchHorizontal,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineFilter,
  HiOutlineCreditCard,
  HiOutlineShoppingBag,
  HiOutlineHome,
  HiOutlineLightningBolt,
  HiOutlineCash,
  HiOutlineExclamation,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import api from '../services/api';
import { mockDashboardData } from '../services/mockDashboardData';
import TransactionModal from '../components/transactions/TransactionModal';
import DeleteConfirmModal from '../components/transactions/DeleteConfirmModal';

const CATEGORY_ICON_MAP = {
  'Housing & Rent': HiOutlineHome,
  'Food & Dining': HiOutlineShoppingBag,
  'Transportation': HiOutlineLightningBolt,
  'Utilities & Subscriptions': HiOutlineCreditCard,
  'Shopping & Apparel': HiOutlineShoppingBag,
  'Salary': HiOutlineCash,
  'Consulting': HiOutlineCash,
  'Income': HiOutlineCash
};

const CATEGORIES_FILTER = [
  'All',
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'expense' | 'income'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: search.trim() || undefined,
        type: typeFilter !== 'All' ? typeFilter.toLowerCase() : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined
      };

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.items || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      // Graceful fallback for standalone frontend demo
      let items = [...mockDashboardData.recentTransactions];

      if (typeFilter !== 'All') {
        items = items.filter((t) => t.type === typeFilter.toLowerCase());
      }
      if (categoryFilter !== 'All') {
        items = items.filter((t) => t.category === categoryFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        items = items.filter(
          (t) =>
            t.description?.toLowerCase().includes(q) ||
            t.merchant?.toLowerCase().includes(q) ||
            t.category?.toLowerCase().includes(q)
        );
      }

      items.sort((a, b) => {
        if (sortBy === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        return sortOrder === 'asc'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date);
      });

      setTotalCount(items.length);
      const start = (page - 1) * pageSize;
      setTransactions(items.slice(start, start + pageSize));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, categoryFilter, sortBy, sortOrder, page]);

  // Handle Create or Update
  const handleSaveTransaction = async (data, id) => {
    if (id) {
      // Edit
      try {
        await api.put(`/transactions/${id}`, data);
      } catch (e) {
        // Fallback local update
      }
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      showToast('Transaction updated successfully.');
    } else {
      // Create
      try {
        const res = await api.post('/transactions', data);
        setTransactions((prev) => [res.data, ...prev]);
      } catch (e) {
        const fakeTx = { id: `tx-${Date.now()}`, ...data, is_anomaly: false };
        setTransactions((prev) => [fakeTx, ...prev]);
      }
      setTotalCount((prev) => prev + 1);
      showToast('Transaction recorded successfully.');
    }
  };

  // Handle Delete
  const handleDeleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (e) {
      // Fallback local delete
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    showToast('Transaction deleted successfully.');
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-emerald-600 shadow-2xl text-xs font-semibold animate-slideUp">
          <HiOutlineCheckCircle size={18} className="text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HiOutlineSwitchHorizontal className="text-indigo-500" />
            Transaction Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete real-time ledger with search, filtering, and instant record editing
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo transition-all self-start sm:self-auto"
        >
          <HiOutlinePlus size={16} />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Controls Bar: Search, Type Tabs, Category, Sort */}
      <div className="p-4 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search description, merchant, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full md:w-auto self-stretch">
            {['All', 'Expense', 'Income'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setTypeFilter(tab);
                  setPage(1);
                }}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  typeFilter === tab
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab === 'All' ? 'All Types' : tab === 'Expense' ? 'Expenses (-)' : 'Income (+)'}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Category & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-fintech-dark-border text-xs">
          <div className="flex items-center space-x-2">
            <HiOutlineFilter className="text-slate-400" />
            <span className="font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              {CATEGORIES_FILTER.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500">Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Date (Newest first)</option>
              <option value="date-asc">Date (Oldest first)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-fintech-dark-border">
                <th className="py-3 px-5">Merchant / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fintech-dark-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No transactions match your criteria.</p>
                    <p className="text-[11px] mt-1">Try adjusting your filters or record a new transaction.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const Icon = CATEGORY_ICON_MAP[tx.category] || HiOutlineCreditCard;
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Merchant & Description */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {tx.merchant || 'General Payee'}
                              </p>
                              {tx.is_anomaly && (
                                <span
                                  title="Unusual transaction flagged by Isolation Forest"
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 flex items-center gap-0.5"
                                >
                                  <HiOutlineExclamation size={12} />
                                  Anomaly
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {tx.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.payment_method || tx.paymentMethod || 'Card'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }
                        >
                          {isIncome ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit transaction"
                          >
                            <HiOutlinePencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingTransaction(tx);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete transaction"
                          >
                            <HiOutlineTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-fintech-dark-border flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{transactions.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalCount}</strong> transactions
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineChevronLeft size={16} />
            </button>
            <span className="font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingTransaction(null);
        }}
        onConfirm={handleDeleteTransaction}
        transaction={deletingTransaction}
      />
    </div>
  );
}
