from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetOut,
    BudgetSummaryResponse,
    CashFlowForecastResponse
)
from app.services.budget_service import (
    get_user_budgets,
    create_or_upsert_budget,
    update_budget,
    delete_budget,
    generate_cash_flow_forecast
)

router = APIRouter(tags=["Budgets"])


@router.get("", response_model=BudgetSummaryResponse)
@router.get("/", response_model=BudgetSummaryResponse)
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns user's category budgets for the current period, with real-time
    spent figures dynamically calculated from the transaction ledger.
    """
    return get_user_budgets(db=db, user_id=current_user.id)


@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates or updates a monthly category budget limit."""
    return create_or_upsert_budget(db=db, user_id=current_user.id, data=data)


@router.put("/{budget_id}", response_model=BudgetOut)
def modify_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates an existing category budget limit or threshold."""
    result = update_budget(db=db, user_id=current_user.id, budget_id=budget_id, data=data)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return result


@router.delete("/{budget_id}")
def remove_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a category budget."""
    success = delete_budget(db=db, user_id=current_user.id, budget_id=budget_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return {"message": "Budget successfully deleted", "id": budget_id}


@router.get("/forecast", response_model=CashFlowForecastResponse)
def get_cash_flow_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulates 30 days of forward cash flow based on income schedule and burn rate."""
    return generate_cash_flow_forecast(db=db, user_id=current_user.id)
