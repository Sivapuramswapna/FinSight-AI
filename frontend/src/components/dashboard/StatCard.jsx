import React from 'react';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive', // 'positive' | 'negative' | 'neutral'
  subtext,
  icon: Icon,
  iconColor = 'indigo'
}) {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
    emerald: 'from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    rose: 'from-rose-500/10 to-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    amber: 'from-amber-500/10 to-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    blue: 'from-blue-500/10 to-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'
  };

  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${colorMap[iconColor] || colorMap.indigo}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>

        {change !== undefined && (
          <div
            className={`flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                : isNegative
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isPositive && <HiTrendingUp size={14} />}
            {isNegative && <HiTrendingDown size={14} />}
            <span>{change > 0 ? `+${change}%` : `${change}%`}</span>
          </div>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
}
