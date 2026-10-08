import React from 'react';
import {
  HiOutlineShoppingBag,
  HiOutlineHome,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineLightningBolt,
  HiOutlineExclamation
} from 'react-icons/hi';
import { NavLink } from 'react-router-dom';

const CATEGORY_ICON_MAP = {
  'Housing & Rent': HiOutlineHome,
  'Food & Dining': HiOutlineShoppingBag,
  'Transportation': HiOutlineLightningBolt,
  'Utilities & Subscriptions': HiOutlineCreditCard,
  'Shopping & Apparel': HiOutlineShoppingBag,
  'Income': HiOutlineCash
};

export default function RecentTransactionsTable({ transactions = [] }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 dark:border-fintech-dark-border flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time feed with AI categorization & anomaly tags
          </p>
        </div>

        <NavLink
          to="/transactions"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          View All &rarr;
        </NavLink>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-fintech-dark-border">
              <th className="py-3 px-5">Merchant / Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-fintech-dark-border text-xs">
            {transactions.map((tx) => {
              const Icon = CATEGORY_ICON_MAP[tx.category] || HiOutlineCreditCard;
              const isIncome = tx.type === 'income';

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Merchant / Description */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {tx.merchant}
                          </p>
                          {tx.isAnomaly && (
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
                    {tx.paymentMethod}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap font-bold">
                    <span
                      className={
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }
                    >
                      {isIncome ? '+' : '-'}
                      ${Math.abs(tx.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
