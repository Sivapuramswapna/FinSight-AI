from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.categorization import CategorizeRequest, CategorizeResponse
from app.ml.categorizer import categorize_transaction

router = APIRouter(tags=["AI Categorization"])


@router.post("/categorize", response_model=CategorizeResponse)
def auto_categorize_transaction(
    request: CategorizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Intelligently predicts the financial category of a transaction based on
    description, merchant name, amount, and user historical memory using
    a hybrid TF-IDF + user preference NLP engine.
    """
    return categorize_transaction(db=db, user_id=current_user.id, request=request)
