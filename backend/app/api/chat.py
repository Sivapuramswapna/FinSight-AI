from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import process_chat_message

router = APIRouter(tags=["AI Financial Assistant"])


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
def handle_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Conversational financial intelligence endpoint grounded in the user's
    real database records. Computes exact category spend, largest transactions,
    affordability simulations, anomalies, and financial health diagnostics.
    """
    return process_chat_message(db=db, user_id=current_user.id, request=request)
