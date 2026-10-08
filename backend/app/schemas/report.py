from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class CategoryShare(BaseModel):
    category: str
    amount: float
    percentage: float


class MerchantSpend(BaseModel):
    merchant: str
    amount: float
    transaction_count: int


class BudgetComplianceItem(BaseModel):
    category: str
    limit: float
    spent: float
    status: str


class ReportSummaryResponse(BaseModel):
    period: str
    year: int
    month: int
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float
    total_transactions: int
    category_breakdown: List[CategoryShare]
    top_merchants: List[MerchantSpend]
    budget_compliance: List[BudgetComplianceItem]
    executive_summary: str
    recommendations: List[str]
