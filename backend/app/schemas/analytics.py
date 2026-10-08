from typing import List, Optional, Dict
from pydantic import BaseModel


class MonthlyMetric(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float


class CategoryMetric(BaseModel):
    name: str
    amount: float
    percentage: float
    color: str


class MerchantMetric(BaseModel):
    merchant: str
    amount: float
    count: int
    percentage: float


class DayTypeMetric(BaseModel):
    type: str  # 'Weekday' or 'Weekend'
    amount: float
    average_per_day: float
    count: int


class PaymentMethodMetric(BaseModel):
    method: str
    amount: float
    percentage: float


class DailySpendingMetric(BaseModel):
    day: str
    amount: float
    baseline: float


class AnalyticsSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float
    avg_daily_spend: float
    transaction_count: int
    spending_change_percent: float
    income_change_percent: float


class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    monthly_trends: List[MonthlyMetric]
    category_distribution: List[CategoryMetric]
    merchant_analysis: List[MerchantMetric]
    weekday_weekend: List[DayTypeMetric]
    payment_methods: List[PaymentMethodMetric]
    daily_velocity: List[DailySpendingMetric]
