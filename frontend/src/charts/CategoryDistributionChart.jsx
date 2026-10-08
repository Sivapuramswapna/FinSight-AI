import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

export default function CategoryDistributionChart({ data = [] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
          <p className="text-slate-500 dark:text-slate-400">
            Amount: <span className="font-semibold text-slate-900 dark:text-white">${item.value.toLocaleString()}</span>
          </p>
          <p className="text-indigo-500 font-semibold">{percentage}% of total expenses</p>
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
            Category Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Spending distribution across budget categories
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
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            ${(total / 1000).toFixed(1)}k
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-fintech-dark-border text-xs">
        {data.slice(0, 4).map((cat) => (
          <div key={cat.name} className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            ></span>
            <span className="truncate text-slate-600 dark:text-slate-400 font-medium">
              {cat.name}
            </span>
            <span className="ml-auto font-bold text-slate-800 dark:text-slate-200">
              {((cat.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
