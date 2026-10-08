import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function ExpenseForecastTrendChart({ data = [] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-white">{label}</p>
          {item.actual !== null && item.actual !== undefined && (
            <p className="text-slate-600 dark:text-slate-300">
              Actual Outflow: <span className="font-bold text-slate-900 dark:text-white">${item.actual.toLocaleString()}</span>
            </p>
          )}
          {item.predicted !== null && item.predicted !== undefined && (
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
              ML Forecast: <span className="font-bold">${item.predicted.toLocaleString()}</span>
            </p>
          )}
          {item.confidence_lower !== null && item.confidence_lower !== undefined && (
            <p className="text-[11px] text-slate-400">
              95% Confidence Range: [${item.confidence_lower.toLocaleString()} - ${item.confidence_upper.toLocaleString()}]
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Historical Outflow &amp; ML Forecast</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              Ridge Regressor
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Past actual expenses transitioning into next month's predictive range
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1F2937' : '#F1F5F9'}
              vertical={false}
            />
            <XAxis
              dataKey="period"
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
            
            {/* Actual Outflow Line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Outflow"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: isDark ? '#111827' : '#FFFFFF' }}
              connectNulls={false}
            />

            {/* Predicted Line */}
            <Line
              type="monotone"
              dataKey="predicted"
              name="ML Forecast"
              stroke="#6366F1"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: isDark ? '#111827' : '#FFFFFF' }}
              connectNulls={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 text-xs pt-3 border-t border-slate-100 dark:border-fintech-dark-border">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Actual Historical Outflow
        </span>
        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> ML Projected Forecast
        </span>
      </div>
    </div>
  );
}
