import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

const PAYMENT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

export default function PaymentMethodPieChart({ data = [] }) {
  const total = data.reduce((acc, curr) => acc + curr.amount, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">{item.method}</p>
          <p className="text-slate-500 dark:text-slate-400">
            Amount: <span className="font-semibold text-slate-900 dark:text-white">${item.amount?.toLocaleString()}</span>
          </p>
          <p className="text-indigo-500 font-semibold">{item.percentage}% of total expenses</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Payment Method Allocation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Breakdown across cards, digital wallets &amp; wires
          </p>
        </div>
      </div>

      <div className="relative h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="amount"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`pm-cell-${index}`}
                  fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            ${(total / 1000).toFixed(1)}k
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-fintech-dark-border text-xs">
        {data.slice(0, 4).map((pm, idx) => (
          <div key={pm.method} className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
            ></span>
            <span className="truncate text-slate-600 dark:text-slate-400 font-medium">
              {pm.method}
            </span>
            <span className="ml-auto font-bold text-slate-800 dark:text-slate-200">
              {pm.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
