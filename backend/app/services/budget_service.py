from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.models import Budget, Goal, Transaction
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetOut,
    BudgetSummaryResponse,
    GoalCreate,
    GoalUpdate,
    GoalOut,
    CashFlowPoint,
    CashFlowForecastResponse
)

DEFAULT_BUDGETS = [
    {"category": "Housing & Rent", "monthly_limit": 2000.0, "alert_threshold": 80.0},
    {"category": "Food & Dining", "monthly_limit": 600.0, "alert_threshold": 80.0},
    {"category": "Transportation", "monthly_limit": 350.0, "alert_threshold": 80.0},
    {"category": "Shopping & Apparel", "monthly_limit": 450.0, "alert_threshold": 80.0},
    {"category": "Utilities & Subscriptions", "monthly_limit": 250.0, "alert_threshold": 80.0},
    {"category": "Entertainment", "monthly_limit": 300.0, "alert_threshold": 80.0}
]

DEFAULT_GOALS = [
    {
        "name": "Emergency Reserve Fund",
        "target_amount": 15000.0,
        "current_amount": 12500.0,
        "target_date": "2026-12-31",
        "monthly_contribution": 500.0,
        "status": "in_progress"
    },
    {
        "name": "New Electric Vehicle",
        "target_amount": 35000.0,
        "current_amount": 14800.0,
        "target_date": "2027-06-30",
        "monthly_contribution": 800.0,
        "status": "in_progress"
    },
    {
        "name": "Japan Autumn Vacation",
        "target_amount": 4500.0,
        "current_amount": 3200.0,
        "target_date": "2026-10-31",
        "monthly_contribution": 300.0,
        "status": "in_progress"
    }
]


def get_current_period(db: Session, user_id: int) -> tuple[int, int]:
    """Finds current year and month based on user's most recent transactions or UTC now."""
    latest_tx = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc()).first()

    if latest_tx and latest_tx.date and len(latest_tx.date) >= 7:
        try:
            parts = latest_tx.date[:7].split('-')
            return int(parts[0]), int(parts[1])
        except Exception:
            pass

    now = datetime.utcnow()
    return now.year, now.month


def get_user_budgets(db: Session, user_id: int) -> BudgetSummaryResponse:
    year, month = get_current_period(db, user_id)

    # 1. Ensure user has budgets for current period
    existing = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month
    ).all()

    existing_cats = {b.category for b in existing}
    added_new = False
    for b_seed in DEFAULT_BUDGETS:
        if b_seed["category"] not in existing_cats:
            db.add(Budget(
                user_id=user_id,
                category=b_seed["category"],
                monthly_limit=b_seed["monthly_limit"],
                alert_threshold=b_seed.get("alert_threshold", 80.0),
                spent=0.0,
                month=month,
                year=year
            ))
            added_new = True

    if added_new:
        db.commit()
        existing = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.year == year,
            Budget.month == month
        ).all()

    # 2. Dynamically calculate spent amounts from Transaction ledger for this period
    period_prefix = f"{year}-{month:02d}"
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense',
        Transaction.date.startswith(period_prefix)
    ).all()

    category_spent = defaultdict(float)
    for tx in transactions:
        category_spent[tx.category] += float(tx.amount)

    budget_out_list: List[BudgetOut] = []
    total_budgeted = 0.0
    total_spent = 0.0

    for b in existing:
        actual_spent = round(category_spent.get(b.category, 0.0), 2)
        b.spent = actual_spent

        limit = float(b.monthly_limit)
        remaining = round(max(0.0, limit - actual_spent), 2)
        pct_used = round((actual_spent / limit * 100.0) if limit > 0 else 0.0, 1)

        threshold = float(b.alert_threshold or 80.0)
        if pct_used >= 100.0:
            status = "Exceeded"
        elif pct_used >= threshold:
            status = "Warning"
        else:
            status = "Safe"

        total_budgeted += limit
        total_spent += actual_spent

        budget_out_list.append(BudgetOut(
            id=b.id,
            user_id=b.user_id,
            category=b.category,
            monthly_limit=limit,
            spent=actual_spent,
            remaining=remaining,
            percent_used=pct_used,
            alert_threshold=threshold,
            status=status,
            month=b.month,
            year=b.year,
            created_at=b.created_at
        ))

    db.commit()

    # Sort: Exceeded first, then Warning, then Safe; by percent_used descending
    status_order = {"Exceeded": 0, "Warning": 1, "Safe": 2}
    budget_out_list.sort(key=lambda x: (status_order.get(x.status, 3), -x.percent_used))

    remaining_cushion = round(max(0.0, total_budgeted - total_spent), 2)
    overall_pct = round((total_spent / total_budgeted * 100.0) if total_budgeted > 0 else 0.0, 1)

    if overall_pct >= 100.0:
        overall_status = "Over Budget"
    elif overall_pct >= 80.0:
        overall_status = "Caution"
    else:
        overall_status = "Healthy"

    return BudgetSummaryResponse(
        total_budgeted=round(total_budgeted, 2),
        total_spent=round(total_spent, 2),
        remaining_cushion=remaining_cushion,
        overall_percent_used=overall_pct,
        status=overall_status,
        budgets=budget_out_list
    )


def create_or_upsert_budget(db: Session, user_id: int, data: BudgetCreate) -> BudgetOut:
    year, month = get_current_period(db, user_id)
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == data.category,
        Budget.year == year,
        Budget.month == month
    ).first()

    if budget:
        budget.monthly_limit = data.monthly_limit
        if data.alert_threshold is not None:
            budget.alert_threshold = data.alert_threshold
    else:
        budget = Budget(
            user_id=user_id,
            category=data.category,
            monthly_limit=data.monthly_limit,
            alert_threshold=data.alert_threshold or 80.0,
            spent=0.0,
            month=month,
            year=year
        )
        db.add(budget)

    db.commit()
    db.refresh(budget)

    # Re-fetch to calculate dynamic spent
    period_prefix = f"{year}-{month:02d}"
    txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.category == data.category,
        Transaction.type == 'expense',
        Transaction.date.startswith(period_prefix)
    ).all()
    actual_spent = round(sum(float(t.amount) for t in txs), 2)
    budget.spent = actual_spent
    db.commit()

    pct_used = round((actual_spent / budget.monthly_limit * 100.0) if budget.monthly_limit > 0 else 0.0, 1)
    status = "Exceeded" if pct_used >= 100.0 else "Warning" if pct_used >= budget.alert_threshold else "Safe"

    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        spent=actual_spent,
        remaining=round(max(0.0, budget.monthly_limit - actual_spent), 2),
        percent_used=pct_used,
        alert_threshold=budget.alert_threshold,
        status=status,
        month=budget.month,
        year=budget.year,
        created_at=budget.created_at
    )


def update_budget(db: Session, user_id: int, budget_id: int, data: BudgetUpdate) -> Optional[BudgetOut]:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        return None

    if data.monthly_limit is not None:
        budget.monthly_limit = data.monthly_limit
    if data.alert_threshold is not None:
        budget.alert_threshold = data.alert_threshold

    db.commit()
    db.refresh(budget)

    pct_used = round((budget.spent / budget.monthly_limit * 100.0) if budget.monthly_limit > 0 else 0.0, 1)
    status = "Exceeded" if pct_used >= 100.0 else "Warning" if pct_used >= budget.alert_threshold else "Safe"

    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        spent=budget.spent,
        remaining=round(max(0.0, budget.monthly_limit - budget.spent), 2),
        percent_used=pct_used,
        alert_threshold=budget.alert_threshold,
        status=status,
        month=budget.month,
        year=budget.year,
        created_at=budget.created_at
    )


def delete_budget(db: Session, user_id: int, budget_id: int) -> bool:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        return False
    db.delete(budget)
    db.commit()
    return True


# -------------------------------------------------------------
# GOALS SERVICE
# -------------------------------------------------------------

def get_user_goals(db: Session, user_id: int) -> List[GoalOut]:
    goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.created_at.asc()).all()

    existing_names = {g.name for g in goals}
    added_new_goal = False
    for g_seed in DEFAULT_GOALS:
        if g_seed["name"] not in existing_names:
            db.add(Goal(
                user_id=user_id,
                name=g_seed["name"],
                target_amount=g_seed["target_amount"],
                current_amount=g_seed["current_amount"],
                target_date=g_seed["target_date"],
                monthly_contribution=g_seed["monthly_contribution"],
                status=g_seed["status"]
            ))
            added_new_goal = True

    if added_new_goal:
        db.commit()
        goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.created_at.asc()).all()

    out_list: List[GoalOut] = []
    for g in goals:
        target = float(g.target_amount)
        current = float(g.current_amount)
        pct = round(min(100.0, (current / target * 100.0) if target > 0 else 100.0), 1)
        rem = round(max(0.0, target - current), 2)
        status = "achieved" if pct >= 100.0 else g.status

        out_list.append(GoalOut(
            id=g.id,
            user_id=g.user_id,
            name=g.name,
            target_amount=target,
            current_amount=current,
            target_date=g.target_date,
            monthly_contribution=float(g.monthly_contribution or 0.0),
            percent_achieved=pct,
            remaining_amount=rem,
            status=status,
            created_at=g.created_at
        ))

    out_list.sort(key=lambda x: (x.status == "achieved", -x.percent_achieved))
    return out_list


def create_goal(db: Session, user_id: int, data: GoalCreate) -> GoalOut:
    goal = Goal(
        user_id=user_id,
        name=data.name,
        target_amount=data.target_amount,
        current_amount=data.current_amount or 0.0,
        target_date=data.target_date,
        monthly_contribution=data.monthly_contribution or 0.0,
        status="in_progress"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    target = float(goal.target_amount)
    current = float(goal.current_amount)
    pct = round(min(100.0, (current / target * 100.0) if target > 0 else 100.0), 1)
    rem = round(max(0.0, target - current), 2)

    return GoalOut(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=target,
        current_amount=current,
        target_date=goal.target_date,
        monthly_contribution=float(goal.monthly_contribution),
        percent_achieved=pct,
        remaining_amount=rem,
        status=goal.status,
        created_at=goal.created_at
    )


def update_goal(db: Session, user_id: int, goal_id: int, data: GoalUpdate) -> Optional[GoalOut]:
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not goal:
        return None

    if data.name is not None:
        goal.name = data.name
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.target_date is not None:
        goal.target_date = data.target_date
    if data.monthly_contribution is not None:
        goal.monthly_contribution = data.monthly_contribution
    if data.status is not None:
        goal.status = data.status

    db.commit()
    db.refresh(goal)

    target = float(goal.target_amount)
    current = float(goal.current_amount)
    pct = round(min(100.0, (current / target * 100.0) if target > 0 else 100.0), 1)
    rem = round(max(0.0, target - current), 2)

    return GoalOut(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=target,
        current_amount=current,
        target_date=goal.target_date,
        monthly_contribution=float(goal.monthly_contribution),
        percent_achieved=pct,
        remaining_amount=rem,
        status=goal.status,
        created_at=goal.created_at
    )


def contribute_to_goal(db: Session, user_id: int, goal_id: int, amount: float) -> Optional[GoalOut]:
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not goal:
        return None

    goal.current_amount = round(float(goal.current_amount) + amount, 2)
    if goal.current_amount >= goal.target_amount:
        goal.status = "achieved"

    db.commit()
    db.refresh(goal)

    target = float(goal.target_amount)
    current = float(goal.current_amount)
    pct = round(min(100.0, (current / target * 100.0) if target > 0 else 100.0), 1)
    rem = round(max(0.0, target - current), 2)

    return GoalOut(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=target,
        current_amount=current,
        target_date=goal.target_date,
        monthly_contribution=float(goal.monthly_contribution),
        percent_achieved=pct,
        remaining_amount=rem,
        status=goal.status,
        created_at=goal.created_at
    )


def delete_goal(db: Session, user_id: int, goal_id: int) -> bool:
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not goal:
        return False
    db.delete(goal)
    db.commit()
    return True


# -------------------------------------------------------------
# CASH FLOW FORECASTING SERVICE
# -------------------------------------------------------------

def generate_cash_flow_forecast(db: Session, user_id: int) -> CashFlowForecastResponse:
    """Simulates 30 days of forward cash flow based on income schedule and burn rate."""
    txs = db.query(Transaction).filter(Transaction.user_id == user_id).all()

    total_income = sum(float(t.amount) for t in txs if t.type == 'income')
    total_expense = sum(float(t.amount) for t in txs if t.type == 'expense')
    starting_balance = max(10000.0, round(total_income - total_expense, 2))

    # Daily burn rate estimation
    daily_burn = round(total_expense / 90.0, 2) if total_expense > 0 else 75.0
    if daily_burn < 30.0:
        daily_burn = 75.0

    # Recurring salary estimation (e.g. $4,500 every 15 days or $2,250 biweekly)
    salary_txs = [t for t in txs if t.category == 'Salary' and t.type == 'income']
    salary_amount = float(salary_txs[0].amount) if salary_txs else 4500.0
    half_salary = round(salary_amount / 2.0, 2)

    now = datetime.utcnow()
    points: List[CashFlowPoint] = []
    running_balance = starting_balance
    total_projected_inflow = 0.0
    total_projected_outflow = 0.0

    for i in range(1, 31):
        dt = now + timedelta(days=i)
        d_str = dt.strftime("%Y-%m-%d")
        day_label = dt.strftime("%b %d")

        inflow = 0.0
        # Recurring salary deposited on 1st and 15th
        if dt.day in [1, 15]:
            inflow = half_salary
            total_projected_inflow += inflow

        # Daily variable expense with slight weekend variation
        outflow = daily_burn * (1.3 if dt.weekday() >= 5 else 0.95)
        outflow = round(outflow, 2)
        total_projected_outflow += outflow

        running_balance = round(running_balance + inflow - outflow, 2)

        points.append(CashFlowPoint(
            date=d_str,
            day_label=day_label,
            projected_balance=running_balance,
            inflow=inflow,
            outflow=outflow
        ))

    net_projected = round(total_projected_inflow - total_projected_outflow, 2)

    return CashFlowForecastResponse(
        current_balance=starting_balance,
        projected_end_balance=running_balance,
        net_projected_cashflow=net_projected,
        daily_projection=points
    )
