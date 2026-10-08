import React, { useState, useEffect } from 'react';
import {
  HiOutlineScale,
  HiOutlineFlag,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineRefresh
} from 'react-icons/hi';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import CashFlowForecastChart from '../charts/CashFlowForecastChart';
import BudgetModal from '../components/budgets/BudgetModal';
import GoalModal from '../components/budgets/GoalModal';

export default function BudgetsGoalsPage() {
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState(null);

  // Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalModalMode, setGoalModalMode] = useState('create'); // 'create' | 'edit' | 'contribute'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, gRes, fRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/goals'),
        api.get('/budgets/forecast')
      ]);

      setBudgetSummary(bRes.data);
      setGoals(gRes.data);

      if (fRes.data?.daily_projection) {
        // Map forecast points for chart
        const chartPoints = fRes.data.daily_projection
          .filter((_, idx) => idx % 3 === 0 || idx === fRes.data.daily_projection.length - 1)
          .map((pt) => ({
            period: pt.day_label,
            balance: pt.projected_balance,
            projectedInflow: pt.inflow,
            projectedOutflow: pt.outflow
          }));
        setForecastData(chartPoints);
      }
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      // Fallback local structures if server is offline
      setBudgetSummary({
        total_budgeted: 4350.0,
        total_spent: 2300.79,
        remaining_cushion: 2049.21,
        overall_percent_used: 52.9,
        status: 'Healthy',
        budgets: [
          { id: 1, category: 'Housing & Rent', monthly_limit: 2000.0, spent: 1800.0, remaining: 200.0, percent_used: 90.0, alert_threshold: 80.0, status: 'Warning' },
          { id: 2, category: 'Food & Dining', monthly_limit: 1000.0, spent: 221.2, remaining: 778.8, percent_used: 22.1, alert_threshold: 80.0, status: 'Safe' },
          { id: 3, category: 'Shopping & Apparel', monthly_limit: 450.0, spent: 189.9, remaining: 260.1, percent_used: 42.2, alert_threshold: 80.0, status: 'Safe' },
          { id: 4, category: 'Transportation', monthly_limit: 350.0, spent: 74.7, remaining: 275.3, percent_used: 21.3, alert_threshold: 80.0, status: 'Safe' },
          { id: 5, category: 'Utilities & Subscriptions', monthly_limit: 250.0, spent: 14.99, remaining: 235.01, percent_used: 6.0, alert_threshold: 80.0, status: 'Safe' },
          { id: 6, category: 'Entertainment', monthly_limit: 300.0, spent: 0.0, remaining: 300.0, percent_used: 0.0, alert_threshold: 80.0, status: 'Safe' }
        ]
      });

      setGoals([
        { id: 1, name: 'Emergency Reserve Fund', target_amount: 50000.0, current_amount: 42500.0, target_date: '2026-12-31', monthly_contribution: 1500.0, percent_achieved: 85.0, remaining_amount: 7500.0, status: 'in_progress' },
        { id: 2, name: 'Japan Autumn Vacation', target_amount: 4500.0, current_amount: 3200.0, target_date: '2026-10-31', monthly_contribution: 300.0, percent_achieved: 71.1, remaining_amount: 1300.0, status: 'in_progress' },
        { id: 3, name: 'New Electric Vehicle', target_amount: 35000.0, current_amount: 14800.0, target_date: '2027-06-30', monthly_contribution: 800.0, percent_achieved: 42.3, remaining_amount: 20200.0, status: 'in_progress' }
      ]);

      setForecastData([
        { period: 'Day 1', balance: 31500, projectedInflow: 0, projectedOutflow: 75 },
        { period: 'Day 5', balance: 31125, projectedInflow: 0, projectedOutflow: 75 },
        { period: 'Day 10', balance: 30750, projectedInflow: 0, projectedOutflow: 75 },
        { period: 'Day 15', balance: 32625, projectedInflow: 2250, projectedOutflow: 75 },
        { period: 'Day 20', balance: 32250, projectedInflow: 0, projectedOutflow: 75 },
        { period: 'Day 25', balance: 31875, projectedInflow: 0, projectedOutflow: 75 },
        { period: 'Day 30', balance: 33750, projectedInflow: 2250, projectedOutflow: 75 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAlert = (msg) => {
    setActionAlert(msg);
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Budget Handlers
  const handleSaveBudget = async (payload, budgetId) => {
    if (budgetId) {
      await api.put(`/budgets/${budgetId}`, payload);
      triggerAlert(`Updated ${payload.category || 'category'} budget.`);
    } else {
      await api.post('/budgets', payload);
      triggerAlert(`Created budget for ${payload.category}.`);
    }
    await fetchData();
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this category budget?')) return;
    try {
      await api.delete(`/budgets/${budgetId}`);
      triggerAlert('Category budget deleted.');
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Goal Handlers
  const handleSaveGoal = async (payload, goalId) => {
    if (goalId) {
      await api.put(`/goals/${goalId}`, payload);
      triggerAlert(`Updated goal: ${payload.name}.`);
    } else {
      await api.post('/goals', payload);
      triggerAlert(`Created new savings goal: ${payload.name}.`);
    }
    await fetchData();
  };

  const handleContributeGoal = async (goalId, amount) => {
    await api.post(`/goals/${goalId}/contribute`, { amount });
    triggerAlert(`Successfully contributed $${amount.toFixed(2)} to goal.`);
    await fetchData();
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.delete(`/goals/${goalId}`);
      triggerAlert('Savings goal deleted.');
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const summary = budgetSummary || {
    total_budgeted: 0,
    total_spent: 0,
    remaining_cushion: 0,
    overall_percent_used: 0,
    status: 'Healthy',
    budgets: []
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <HiOutlineScale className="text-indigo-500" />
              Budgets, Goals &amp; Cash Flow
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                summary.status === 'Over Budget'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : summary.status === 'Caution'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  summary.status === 'Over Budget'
                    ? 'bg-rose-500 animate-pulse'
                    : summary.status === 'Caution'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              ></span>
              {summary.status} ({summary.overall_percent_used}% Spent)
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time ledger-synchronized category spending caps, milestone wealth targets, and 30-day liquidity projections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedBudget(null);
              setIsBudgetModalOpen(true);
            }}
            className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3.5"
          >
            <HiOutlinePlus className="w-4 h-4 text-indigo-500" />
            <span>Set Budget</span>
          </button>
          <button
            onClick={() => {
              setSelectedGoal(null);
              setGoalModalMode('create');
              setIsGoalModalOpen(true);
            }}
            className="btn btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-glow-indigo"
          >
            <HiOutlineFlag className="w-4 h-4" />
            <span>New Savings Goal</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <HiOutlineCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{actionAlert}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Budget Summary KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Budgeted"
          value={`$${summary.total_budgeted.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Monthly planned allocation"
          trend="up"
          trendValue="Active Caps"
          icon={HiOutlineCurrencyDollar}
          color="indigo"
        />
        <StatCard
          title="Actual Spent"
          value={`$${summary.total_spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Aggregated from live ledger"
          trend="up"
          trendValue={`${summary.overall_percent_used}% Used`}
          icon={HiOutlineTrendingUp}
          color={summary.overall_percent_used >= 80 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Remaining Cushion"
          value={`$${summary.remaining_cushion.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Available before exceeding"
          trend="down"
          trendValue="Safe Buffer"
          icon={HiOutlineScale}
          color="purple"
        />
        <StatCard
          title="Budget Health"
          value={summary.status}
          subtitle={`${summary.budgets.filter((b) => b.status === 'Warning' || b.status === 'Exceeded').length} Alerts Triggered`}
          trend="up"
          trendValue="Synchronized"
          icon={HiOutlineExclamation}
          color={summary.status === 'Healthy' ? 'emerald' : 'rose'}
        />
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Category Spending Limits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live consumption tracking with automated warning notifications
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {summary.budgets.length} Category Budgets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {summary.budgets.map((b) => {
            const isExceeded = b.status === 'Exceeded';
            const isWarning = b.status === 'Warning';
            const barWidth = Math.min(100, b.percent_used);

            return (
              <div
                key={b.id}
                className={`glass-panel p-5 rounded-2xl border transition-all space-y-4 ${
                  isExceeded
                    ? 'border-rose-500/40 bg-rose-500/[0.02]'
                    : isWarning
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {b.category}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 uppercase tracking-wider ${
                        isExceeded
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {b.status} • {b.percent_used}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedBudget(b);
                        setIsBudgetModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Budget"
                    >
                      <HiOutlinePencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Budget"
                    >
                      <HiOutlineTrash size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>
                      Spent: <strong className="text-slate-800 dark:text-slate-200">${b.spent.toLocaleString()}</strong>
                    </span>
                    <span>Cap: ${b.monthly_limit.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer remaining */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Remaining Cushion:</span>
                  <span
                    className={`font-bold ${
                      isExceeded
                        ? 'text-rose-500'
                        : isWarning
                        ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    ${b.remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Savings Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HiOutlineFlag className="text-indigo-500" />
              Financial Savings Goals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Wealth building milestones and active deposit targets
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {goals.length} Active Goals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isAchieved = g.status === 'achieved' || g.percent_achieved >= 100;

            return (
              <div
                key={g.id}
                className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {g.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target Date: {g.target_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedGoal(g);
                          setGoalModalMode('edit');
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Goal"
                      >
                        <HiOutlinePencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Goal"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      ${g.current_amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Goal: ${g.target_amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAchieved
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                        }`}
                        style={{ width: `${Math.min(100, g.percent_achieved)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{g.percent_achieved}% Achieved</span>
                      <span>${g.remaining_amount.toLocaleString()} to go</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    {g.monthly_contribution > 0 ? (
                      <span>+${g.monthly_contribution}/mo deposit</span>
                    ) : (
                      <span>Ad-hoc deposit</span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setGoalModalMode('contribute');
                      setIsGoalModalOpen(true);
                    }}
                    className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-3 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    <span>Contribute</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day Forward Cash Flow Projection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineTrendingUp className="text-emerald-500" />
            30-Day Forward Liquidity Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Predictive cash flow modeling combining recurring payroll timing and smoothed category burn velocity
          </p>
        </div>

        <CashFlowForecastChart data={forecastData} />
      </div>

      {/* Modals */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        budget={selectedBudget}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        onContribute={handleContributeGoal}
        goal={selectedGoal}
        mode={goalModalMode}
      />
    </div>
  );
}
