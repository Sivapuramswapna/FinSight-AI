from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    alert_threshold: Optional[float] = 80.0


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    alert_threshold: Optional[float] = None


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    spent: float
    remaining: float
    percent_used: float
    alert_threshold: float
    status: str  # 'Safe' | 'Warning' | 'Exceeded'
    month: int
    year: int
    created_at: datetime


class BudgetSummaryResponse(BaseModel):
    total_budgeted: float
    total_spent: float
    remaining_cushion: float
    overall_percent_used: float
    status: str  # 'Healthy' | 'Caution' | 'Over Budget'
    budgets: List[BudgetOut]


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    target_date: str  # YYYY-MM-DD
    current_amount: Optional[float] = 0.0
    monthly_contribution: Optional[float] = 0.0


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    monthly_contribution: Optional[float] = None
    status: Optional[str] = None


class GoalContribute(BaseModel):
    amount: float


class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: str
    monthly_contribution: float
    percent_achieved: float
    remaining_amount: float
    status: str
    created_at: datetime


class CashFlowPoint(BaseModel):
    date: str
    day_label: str
    projected_balance: float
    inflow: float
    outflow: float


class CashFlowForecastResponse(BaseModel):
    current_balance: float
    projected_end_balance: float
    net_projected_cashflow: float
    daily_projection: List[CashFlowPoint]
