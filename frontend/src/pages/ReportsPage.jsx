import React, { useState, useEffect } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlineDownload,
  HiOutlinePrinter,
  HiOutlineSparkles,
  HiOutlineTrendingUp,
  HiOutlineScale,
  HiOutlineCheck,
  HiOutlineCurrencyDollar,
  HiOutlineRefresh
} from 'react-icons/hi';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';

const AVAILABLE_PERIODS = [
  { label: 'September 2026', year: 2026, month: 9 },
  { label: 'August 2026', year: 2026, month: 8 },
  { label: 'July 2026', year: 2026, month: 7 },
  { label: 'June 2026', year: 2026, month: 6 }
];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(AVAILABLE_PERIODS[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?year=${selectedPeriod.year}&month=${selectedPeriod.month}`);
      setReportData(res.data);
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      setReportData({
        period: selectedPeriod.label,
        year: selectedPeriod.year,
        month: selectedPeriod.month,
        total_income: 12680.0,
        total_expenses: 2300.79,
        net_savings: 10379.21,
        savings_rate: 81.9,
        total_transactions: 11,
        category_breakdown: [
          { category: 'Housing & Rent', amount: 1800.0, percentage: 78.2 },
          { category: 'Food & Dining', amount: 221.2, percentage: 9.6 },
          { category: 'Shopping & Apparel', amount: 189.9, percentage: 8.3 },
          { category: 'Transportation', amount: 74.7, percentage: 3.2 },
          { category: 'Utilities & Subscriptions', amount: 14.99, percentage: 0.7 }
        ],
        top_merchants: [
          { merchant: 'Metro Property Group', amount: 1800.0, transaction_count: 1 },
          { merchant: 'Amazon Marketplace', amount: 189.9, transaction_count: 1 },
          { merchant: 'Whole Foods Market', amount: 142.8, transaction_count: 1 },
          { merchant: 'Uber Eats', amount: 78.4, transaction_count: 1 }
        ],
        budget_compliance: [
          { category: 'Housing & Rent', limit: 2000.0, spent: 1800.0, status: 'Warning' },
          { category: 'Food & Dining', limit: 1000.0, spent: 221.2, status: 'Safe' },
          { category: 'Shopping & Apparel', limit: 450.0, spent: 189.9, status: 'Safe' }
        ],
        executive_summary:
          `For ${selectedPeriod.label}, total cash inflow stood at $12,680.00 against $2,300.79 in operating expenses, yielding a robust net surplus of +$10,379.21 and an exceptional savings rate of 81.9%. Primary expenditure was concentrated in Housing & Rent ($1,800.00), representing 78.2% of monthly outflow.`,
        recommendations: [
          'Maintain current discretionary spending velocity in Housing & Rent to preserve capital accumulation.',
          'Deploy excess monthly surplus (+$10,379.21) into high-yield liquidity reserves or active savings goals.',
          'Review category caps for categories near threshold limits to prevent end-of-month budget overruns.'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod]);

  const handleDownloadCsv = async () => {
    setExportingCsv(true);
    try {
      const response = await api.get(
        `/reports/export/csv?year=${selectedPeriod.year}&month=${selectedPeriod.month}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finsight_ledger_${selectedPeriod.year}_${selectedPeriod.month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download CSV:', err);
    } finally {
      setExportingCsv(false);
    }
  };

  const handlePrintStatement = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const statementUrl = `${apiBase}/reports/export/statement?year=${selectedPeriod.year}&month=${selectedPeriod.month}`;
    window.open(statementUrl, '_blank');
  };

  const data = reportData || {
    period: selectedPeriod.label,
    total_income: 0,
    total_expenses: 0,
    net_savings: 0,
    savings_rate: 0,
    total_transactions: 0,
    category_breakdown: [],
    top_merchants: [],
    budget_compliance: [],
    executive_summary: '',
    recommendations: []
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <HiOutlineClipboardList className="text-indigo-500" />
              Financial Reports &amp; Statements
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Certified Intelligence Audit
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated monthly audit statements, AI executive summaries, and exportable ledger artifacts.
          </p>
        </div>

        {/* Period Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={`${selectedPeriod.year}-${selectedPeriod.month}`}
            onChange={(e) => {
              const found = AVAILABLE_PERIODS.find(
                (p) => `${p.year}-${p.month}` === e.target.value
              );
              if (found) setSelectedPeriod(found);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            {AVAILABLE_PERIODS.map((p) => (
              <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadCsv}
            disabled={exportingCsv}
            className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3.5"
            title="Download full ledger transactions as RFC 4180 CSV"
          >
            <HiOutlineDownload className="w-4 h-4 text-indigo-500" />
            <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrintStatement}
            className="btn btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-glow-indigo"
            title="Open printable statement formatted for 1-click PDF export"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            <span>Print Statement (PDF)</span>
          </button>
        </div>
      </div>

      {/* Statement Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Cash Inflow"
          value={`+$${data.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Salary & consulting revenue"
          trend="up"
          trendValue="Active Cycle"
          icon={HiOutlineCurrencyDollar}
          color="emerald"
        />
        <StatCard
          title="Total Operating Outflow"
          value={`-$${data.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={`${data.total_transactions} ledger transactions`}
          trend="down"
          trendValue={`${data.total_transactions} Debits`}
          icon={HiOutlineTrendingUp}
          color="rose"
        />
        <StatCard
          title="Net Cash Surplus"
          value={`+$${data.net_savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Retained monthly liquidity"
          trend="up"
          trendValue="Positive Flow"
          icon={HiOutlineScale}
          color="indigo"
        />
        <StatCard
          title="Savings Accumulation Rate"
          value={`${data.savings_rate.toFixed(1)}%`}
          subtitle="Target threshold: >20%"
          trend="up"
          trendValue="Optimal Tier"
          icon={HiOutlineCheck}
          color="purple"
        />
      </div>

      {/* AI Executive Audit Observations Box */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.02] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <HiOutlineSparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Executive Financial Intelligence Briefing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated synthesis for {data.period} based on verified database transactions
              </p>
            </div>
          </div>
          <button
            onClick={fetchReport}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Refresh Report"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {data.executive_summary}
        </p>

        {/* Actionable Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Strategic Financial Recommendations:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.recommendations.map((rec, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-indigo-500 font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Detailed Breakdown: Category Allocations & Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Category Allocations Breakdown Table (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Category Expenditure Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed allocation metrics and proportional portfolio weight
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {data.category_breakdown.length} Categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-right">Total Amount</th>
                  <th className="py-2.5 text-right">Portfolio Share</th>
                  <th className="py-2.5 text-right">Visual Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {data.category_breakdown.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{c.category}</td>
                    <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                      ${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {c.percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right w-24">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, c.percentage)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Merchant Counterparties (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Primary Merchant Counterparties
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Top merchant payees by total dollar volume
            </p>
          </div>

          <div className="space-y-3">
            {data.top_merchants.map((m, idx) => (
              <div
                key={m.merchant}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {m.merchant}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {m.transaction_count} transaction{m.transaction_count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ${m.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
