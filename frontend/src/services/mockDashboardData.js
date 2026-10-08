export const mockDashboardData = {
  summary: {
    currentBalance: 42850.75,
    totalIncome: 12400.00,
    totalExpenses: 4820.30,
    netSavings: 7579.70,
    savingsRate: 61.1,
    monthlySpending: 4820.30,
    spendingChangePercent: -8.4,
    incomeChangePercent: 12.5,
    budgetTotal: 7000.00,
    budgetSpent: 4820.30,
    budgetUtilization: 68.9,
    financialHealthScore: 88,
    financialHealthTier: 'Excellent',
    healthFactors: {
      savingsRatio: 92,
      budgetControl: 85,
      debtRatio: 95,
      cashFlowStability: 82
    }
  },

  incomeVsExpenses: [
    { month: 'Apr', income: 10500, expenses: 5200, savings: 5300 },
    { month: 'May', income: 11000, expenses: 5800, savings: 5200 },
    { month: 'Jun', income: 10800, expenses: 4900, savings: 5900 },
    { month: 'Jul', income: 11500, expenses: 5100, savings: 6400 },
    { month: 'Aug', income: 11200, expenses: 5260, savings: 5940 },
    { month: 'Sep', income: 12400, expenses: 4820, savings: 7580 }
  ],

  categoryDistribution: [
    { name: 'Housing & Rent', value: 1800, color: '#6366F1' },
    { name: 'Food & Dining', value: 920, color: '#10B981' },
    { name: 'Transportation', value: 450, color: '#3B82F6' },
    { name: 'Utilities & Subscriptions', value: 380, color: '#F59E0B' },
    { name: 'Shopping & Apparel', value: 520, color: '#EC4899' },
    { name: 'Healthcare & Wellness', value: 310, color: '#14B8A6' },
    { name: 'Entertainment', value: 440, color: '#8B5CF6' }
  ],

  spendingTrends: [
    { day: 'Sep 01', amount: 120, baseline: 160 },
    { day: 'Sep 04', amount: 240, baseline: 160 },
    { day: 'Sep 07', amount: 95, baseline: 160 },
    { day: 'Sep 10', amount: 310, baseline: 160 },
    { day: 'Sep 13', amount: 150, baseline: 160 },
    { day: 'Sep 16', amount: 180, baseline: 160 },
    { day: 'Sep 19', amount: 140, baseline: 160 }
  ],

  cashFlowForecast: [
    { period: 'Current', balance: 42850, projectedInflow: 12400, projectedOutflow: 4820 },
    { period: 'Oct W1', balance: 44200, projectedInflow: 3100, projectedOutflow: 1200 },
    { period: 'Oct W2', balance: 45800, projectedInflow: 3100, projectedOutflow: 1500 },
    { period: 'Oct W3', balance: 47600, projectedInflow: 3100, projectedOutflow: 1300 },
    { period: 'Oct W4', balance: 50430, projectedInflow: 3100, projectedOutflow: 1150 }
  ],

  recentTransactions: [
    {
      id: 'tx-001',
      merchant: 'Apple Store',
      description: 'App Store Cloud Subscription',
      category: 'Utilities & Subscriptions',
      subcategory: 'Software',
      type: 'expense',
      amount: 14.99,
      date: '2026-09-19',
      paymentMethod: 'Apple Pay (Visa *4821)',
      status: 'completed',
      isAnomaly: false,
      notes: 'Monthly iCloud storage'
    },
    {
      id: 'tx-002',
      merchant: 'Stripe Inc.',
      description: 'Consulting Retainer Payout',
      category: 'Income',
      subcategory: 'Consulting',
      type: 'income',
      amount: 3200.00,
      date: '2026-09-18',
      paymentMethod: 'Direct Deposit',
      status: 'completed',
      isAnomaly: false,
      notes: 'Q3 Enterprise Architecture Retainer'
    },
    {
      id: 'tx-003',
      merchant: 'Whole Foods Market',
      description: 'Weekly Organic Groceries',
      category: 'Food & Dining',
      subcategory: 'Groceries',
      type: 'expense',
      amount: 142.80,
      date: '2026-09-17',
      paymentMethod: 'Mastercard *9012',
      status: 'completed',
      isAnomaly: false,
      notes: 'Household groceries'
    },
    {
      id: 'tx-004',
      merchant: 'Tesla Supercharger',
      description: 'EV Fast Charging Session',
      category: 'Transportation',
      subcategory: 'Charging',
      type: 'expense',
      amount: 28.50,
      date: '2026-09-16',
      paymentMethod: 'Visa *4821',
      status: 'completed',
      isAnomaly: false,
      notes: 'Highway supercharger'
    },
    {
      id: 'tx-005',
      merchant: 'Amazon Marketplace',
      description: 'Ergonomic Desk Accessories',
      category: 'Shopping & Apparel',
      subcategory: 'Home Office',
      type: 'expense',
      amount: 189.90,
      date: '2026-09-15',
      paymentMethod: 'Mastercard *9012',
      status: 'completed',
      isAnomaly: true,
      notes: 'Unusual spending bump detected'
    },
    {
      id: 'tx-006',
      merchant: 'Apex Tech Corp',
      description: 'Bi-weekly Payroll Salary',
      category: 'Income',
      subcategory: 'Salary',
      type: 'income',
      amount: 4500.00,
      date: '2026-09-15',
      paymentMethod: 'Direct Deposit',
      status: 'completed',
      isAnomaly: false,
      notes: 'Regular bi-weekly salary'
    }
  ]
};
