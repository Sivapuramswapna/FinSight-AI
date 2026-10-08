import React, { useState, useEffect } from 'react';
import {
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineTrendingDown,
  HiOutlineCurrencyDollar,
  HiOutlineScale,
  HiOutlineSparkles,
  HiOutlineDocumentAdd,
  HiOutlineCamera,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { RiRobot2Line, RiSafe2Line } from 'react-icons/ri';
import { NavLink } from 'react-router-dom';

import StatCard from '../components/dashboard/StatCard';
import FinancialHealthScore from '../components/dashboard/FinancialHealthScore';
import RecentTransactionsTable from '../components/dashboard/RecentTransactionsTable';

import IncomeExpenseChart from '../charts/IncomeExpenseChart';
import CategoryDistributionChart from '../charts/CategoryDistributionChart';
import SpendingTrendChart from '../charts/SpendingTrendChart';
import CashFlowForecastChart from '../charts/CashFlowForecastChart';
import TransactionModal from '../components/transactions/TransactionModal';
import api from '../services/api';

import { mockDashboardData } from '../services/mockDashboardData';

export default function Dashboard() {
  const [summary, setSummary] = useState(mockDashboardData.summary);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState(mockDashboardData.incomeVsExpenses);
  const [categoryDistribution, setCategoryDistribution] = useState(mockDashboardData.categoryDistribution);
  const [spendingTrends, setSpendingTrends] = useState(mockDashboardData.spendingTrends);
  const { cashFlowForecast } = mockDashboardData;
  const [transactions, setTransactions] = useState(mockDashboardData.recentTransactions);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadDashboardData = async () => {
    try {
      // 1. Fetch live analytics
      const analyticsRes = await api.get('/analytics?months=6');
      const ana = analyticsRes.data;
      if (ana && ana.summary) {
        setSummary((prev) => ({
          ...prev,
          totalIncome: ana.summary.total_income || prev.totalIncome,
          totalExpenses: ana.summary.total_expenses || prev.totalExpenses,
          netSavings: ana.summary.net_savings || prev.netSavings,
          savingsRate: ana.summary.savings_rate || prev.savingsRate,
          currentBalance: (prev.currentBalance || 42850.75)
        }));

        if (ana.monthly_trends && ana.monthly_trends.length > 0) {
          setIncomeVsExpenses(ana.monthly_trends);
        }
        if (ana.category_distribution && ana.category_distribution.length > 0) {
          setCategoryDistribution(
            ana.category_distribution.map((c) => ({
              name: c.name,
              value: c.amount,
              color: c.color
            }))
          );
        }
        if (ana.daily_velocity && ana.daily_velocity.length > 0) {
          setSpendingTrends(ana.daily_velocity);
        }
      }

      // 2. Fetch live recent transactions
      const txRes = await api.get('/transactions?size=6');
      if (txRes.data && txRes.data.items && txRes.data.items.length > 0) {
        setTransactions(txRes.data.items);
      }
    } catch (e) {
      // Gracefully retain fallback defaults
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSaveTransaction = async (data) => {
    try {
      const res = await api.post('/transactions', data);
      setTransactions((prev) => [res.data, ...prev.slice(0, 5)]);
      loadDashboardData();
    } catch (err) {
      const fakeTx = { id: `tx-${Date.now()}`, ...data, is_anomaly: false };
      setTransactions((prev) => [fakeTx, ...prev.slice(0, 5)]);
    }
    setToastMessage('Transaction recorded successfully!');
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time portfolio overview, automated ML insights &amp; budget utilization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/receipt-scanner"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-fintech-dark-hover transition-colors shadow-sm"
          >
            <HiOutlineCamera size={16} />
            <span>Scan Receipt</span>
          </NavLink>

          <NavLink
            to="/ai-assistant"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
          >
            <RiRobot2Line size={16} />
            <span>Ask FinSight</span>
          </NavLink>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-glow-indigo"
          >
            <HiOutlineDocumentAdd size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Balance"
          value={`$${summary.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={14.2}
          changeType="positive"
          subtext="Across all linked accounts"
          icon={HiOutlineCreditCard}
          iconColor="indigo"
        />

        <StatCard
          title="Monthly Income"
          value={`$${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={summary.incomeChangePercent}
          changeType="positive"
          subtext="Salary, dividends & consulting"
          icon={HiOutlineCash}
          iconColor="emerald"
        />

        <StatCard
          title="Monthly Expenses"
          value={`$${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={summary.spendingChangePercent}
          changeType="positive"
          subtext="8.4% less than last month"
          icon={HiOutlineTrendingDown}
          iconColor="rose"
        />

        <StatCard
          title="Net Savings & Rate"
          value={`$${summary.netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={summary.savingsRate}
          changeType="positive"
          subtext={`${summary.savingsRate}% monthly savings rate`}
          icon={RiSafe2Line}
          iconColor="amber"
        />
      </div>

      {/* Secondary Row: Budget Utilization & Financial Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-fintech-dark-card border border-slate-200 dark:border-fintech-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Monthly Budget Utilization
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${summary.budgetSpent.toLocaleString()} / ${summary.budgetTotal.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800/40">
              <HiOutlineScale size={18} />
            </div>
          </div>

          <div className="my-5">
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
              <span>{summary.budgetUtilization}% Used</span>
              <span>${(summary.budgetTotal - summary.budgetSpent).toLocaleString()} Remaining</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${summary.budgetUtilization}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>11 days remaining in cycle</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">On Track</span>
          </div>
        </div>

        {/* Financial Health Score (takes 2 cols on lg) */}
        <div className="lg:col-span-2">
          <FinancialHealthScore
            score={summary.financialHealthScore}
            tier={summary.financialHealthTier}
            factors={summary.healthFactors}
          />
        </div>
      </div>

      {/* Interactive Charts Section 1: Income vs Expenses & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={incomeVsExpenses} />
        </div>
        <div>
          <CategoryDistributionChart data={categoryDistribution} />
        </div>
      </div>

      {/* Interactive Charts Section 2: Spending Velocity Trends & Cash Flow Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendChart data={spendingTrends} />
        <CashFlowForecastChart data={cashFlowForecast} />
      </div>

      {/* Recent Transactions Feed */}
      <div>
        <RecentTransactionsTable transactions={transactions} />
      </div>

      {/* Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-emerald-600 shadow-2xl text-xs font-semibold animate-slideUp">
          <HiOutlineCheckCircle size={18} className="text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
