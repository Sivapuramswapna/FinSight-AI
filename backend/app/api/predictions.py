from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.prediction import PredictionResponse
from app.ml.expense_predictor import predict_expenses

router = APIRouter(tags=["ML Predictions"])


@router.get("", response_model=PredictionResponse)
def get_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return predict_expenses(db=db, user_id=current_user.id)
