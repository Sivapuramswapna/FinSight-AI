import React from 'react';
import { HiOutlineSparkles, HiOutlineCheckCircle } from 'react-icons/hi';

export default function FinancialHealthScore({ score = 88, tier = 'Excellent', factors = {} }) {
  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (val >= 60) return 'text-indigo-500 stroke-indigo-500';
    if (val >= 40) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Financial Health Score</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              {tier}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluated across 4 core financial pillars by AI
          </p>
        </div>

        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
          <HiOutlineSparkles size={20} />
        </div>
      </div>

      {/* Main Score Centerpiece */}
      <div className="my-6 flex items-center justify-center space-x-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Circular progress SVG */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
              strokeWidth="8"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * score) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Out of 100
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 space-y-2.5">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              <span>Savings Ratio</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{factors.savingsRatio || 92}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${factors.savingsRatio || 92}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              <span>Budget Control</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{factors.budgetControl || 85}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${factors.budgetControl || 85}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              <span>Debt Ratio</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{factors.debtRatio || 95}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${factors.debtRatio || 95}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              <span>Cash Stability</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{factors.cashFlowStability || 82}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${factors.cashFlowStability || 82}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Advice Pill */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start space-x-2.5">
        <HiOutlineCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5 text-base" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">AI Assessment:</strong> Strong savings trajectory. Maintaining current discretionary spending will allow you to exceed your annual emergency fund target 2 months early.
        </p>
      </div>
    </div>
  );
}
