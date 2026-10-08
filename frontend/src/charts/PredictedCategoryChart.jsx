import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function PredictedCategoryChart({ data = [] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">{label}</p>
          <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
            <span>Historical Avg:</span>
            <span className="font-semibold text-slate-900 dark:text-white">${item.historical_avg?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 text-indigo-500 font-semibold">
            <span>Predicted Next Month:</span>
            <span>${item.predicted_amount?.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Expected Variance: {item.change_percent > 0 ? `+${item.change_percent}%` : `${item.change_percent}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Category Variance: Baseline vs. Predicted
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Expected category-by-category shifts for the upcoming month
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1F2937' : '#F1F5F9'}
              vertical={false}
            />
            <XAxis
              dataKey="category"
              stroke={isDark ? '#6B7280' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#6B7280' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="historical_avg"
              name="Historical Baseline"
              fill={isDark ? '#374151' : '#CBD5E1'}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="predicted_amount"
              name="Predicted Next Month"
              fill="#6366F1"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 text-xs pt-3 border-t border-slate-100 dark:border-fintech-dark-border">
        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Historical Baseline
        </span>
        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> ML Expected Outflow
        </span>
      </div>
    </div>
  );
}
