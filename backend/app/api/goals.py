from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.budget import (
    GoalCreate,
    GoalUpdate,
    GoalContribute,
    GoalOut
)
from app.services.budget_service import (
    get_user_goals,
    create_goal,
    update_goal,
    contribute_to_goal,
    delete_goal
)

router = APIRouter(tags=["Financial Goals"])


@router.get("", response_model=List[GoalOut])
@router.get("/", response_model=List[GoalOut])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all financial savings goals for the authenticated user."""
    return get_user_goals(db=db, user_id=current_user.id)


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def add_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new financial savings goal."""
    return create_goal(db=db, user_id=current_user.id, data=data)


@router.put("/{goal_id}", response_model=GoalOut)
def modify_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates an existing savings goal parameters."""
    result = update_goal(db=db, user_id=current_user.id, goal_id=goal_id, data=data)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return result


@router.post("/{goal_id}/contribute", response_model=GoalOut)
def contribute_funds(
    goal_id: int,
    data: GoalContribute,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Contributes funds towards a savings goal."""
    if data.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contribution must be greater than $0")
    result = contribute_to_goal(db=db, user_id=current_user.id, goal_id=goal_id, amount=data.amount)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return result


@router.delete("/{goal_id}")
def remove_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a financial savings goal."""
    success = delete_goal(db=db, user_id=current_user.id, goal_id=goal_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return {"message": "Goal successfully deleted", "id": goal_id}
