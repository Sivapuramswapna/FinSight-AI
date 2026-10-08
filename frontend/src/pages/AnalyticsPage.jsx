import React, { useState, useEffect } from 'react';
import {
  HiOutlineChartBar,
  HiOutlineCash,
  HiOutlineTrendingDown,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineRefresh
} from 'react-icons/hi';
import { RiSafe2Line } from 'react-icons/ri';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import IncomeExpenseChart from '../charts/IncomeExpenseChart';
import CategoryDistributionChart from '../charts/CategoryDistributionChart';
import SpendingTrendChart from '../charts/SpendingTrendChart';
import MerchantBarChart from '../charts/MerchantBarChart';
import WeekdayWeekendChart from '../charts/WeekdayWeekendChart';
import PaymentMethodPieChart from '../charts/PaymentMethodPieChart';
import { mockDashboardData } from '../services/mockDashboardData';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState(6); // 3, 6, 12 months
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async (months) => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics?months=${months}`);
      setAnalytics(res.data);
    } catch (err) {
      // Fallback structure matching AnalyticsResponse
      setAnalytics({
        summary: {
          total_income: mockDashboardData.summary.totalIncome * (months / 6),
          total_expenses: mockDashboardData.summary.totalExpenses * (months / 6),
          net_savings: mockDashboardData.summary.netSavings * (months / 6),
          savings_rate: mockDashboardData.summary.savingsRate,
          avg_daily_spend: 160.67,
          transaction_count: mockDashboardData.recentTransactions.length,
          spending_change_percent: -8.4,
          income_change_percent: 12.5
        },
        monthly_trends: mockDashboardData.incomeVsExpenses.slice(-months),
        category_distribution: mockDashboardData.categoryDistribution,
        merchant_analysis: [
          { merchant: 'Metro Property Group', amount: 5400.0, count: 3, percentage: 52.0 },
          { merchant: 'Apple Store', amount: 1213.99, count: 2, percentage: 11.7 },
          { merchant: 'Trader Joe\'s', amount: 620.0, count: 1, percentage: 6.0 },
          { merchant: 'Delta Airlines', amount: 450.0, count: 1, percentage: 4.3 },
          { merchant: 'Nordstrom', amount: 410.0, count: 1, percentage: 3.9 }
        ],
        weekday_weekend: [
          { type: 'Weekday', amount: 8940.0, average_per_day: 596.0, count: 15 },
          { type: 'Weekend', amount: 1439.79, average_per_day: 205.68, count: 7 }
        ],
        payment_methods: [
          { method: 'Bank Wire / ACH', amount: 5400.0, percentage: 52.0 },
          { method: 'Credit Card', amount: 3840.40, percentage: 37.0 },
          { method: 'Apple Pay', amount: 93.39, percentage: 0.9 },
          { method: 'Debit Card', amount: 46.20, percentage: 0.4 }
        ],
        daily_velocity: mockDashboardData.spendingTrends
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const summary = analytics?.summary || {
    total_income: 0,
    total_expenses: 0,
    net_savings: 0,
    savings_rate: 0,
    avg_daily_spend: 0
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HiOutlineChartBar className="text-indigo-500" />
            Financial Analytics &amp; Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep-dive multi-dimensional spending patterns, vendor concentrations &amp; habits
          </p>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center space-x-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start sm:self-auto">
          {[
            { label: '3 Months', value: 3 },
            { label: '6 Months', value: 6 },
            { label: '12 Months', value: 12 }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTimeframe(item.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeframe === item.value
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => fetchAnalytics(timeframe)}
            title="Refresh Analytics"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <HiOutlineRefresh size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Period Inflow (Income)"
          value={`$${summary.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={summary.income_change_percent}
          changeType="positive"
          subtext={`Cumulative across ${timeframe} months`}
          icon={HiOutlineCash}
          iconColor="emerald"
        />

        <StatCard
          title="Period Outflow (Expenses)"
          value={`$${summary.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={summary.spending_change_percent}
          changeType="positive"
          subtext={`Avg daily: $${summary.avg_daily_spend.toFixed(2)}`}
          icon={HiOutlineTrendingDown}
          iconColor="rose"
        />

        <StatCard
          title="Net Accumulation"
          value={`$${summary.net_savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={summary.savings_rate}
          changeType="positive"
          subtext="Net liquidity growth"
          icon={RiSafe2Line}
          iconColor="indigo"
        />

        <StatCard
          title="Savings Efficiency"
          value={`${summary.savings_rate}%`}
          change={4.2}
          changeType="positive"
          subtext="Savings to income ratio"
          icon={HiOutlineCurrencyDollar}
          iconColor="amber"
        />
      </div>

      {/* Charts Row 1: Income vs. Expenses & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={analytics?.monthly_trends || []} />
        </div>
        <div>
          <CategoryDistributionChart
            data={
              analytics?.category_distribution?.map((c) => ({
                name: c.name,
                value: c.amount,
                color: c.color
              })) || []
            }
          />
        </div>
      </div>

      {/* Charts Row 2: Top Merchants & Weekday vs Weekend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MerchantBarChart data={analytics?.merchant_analysis || []} />
        <WeekdayWeekendChart data={analytics?.weekday_weekend || []} />
      </div>

      {/* Charts Row 3: Payment Methods & Daily Spending Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentMethodPieChart data={analytics?.payment_methods || []} />
        <SpendingTrendChart data={analytics?.daily_velocity || []} />
      </div>
    </div>
  );
}
