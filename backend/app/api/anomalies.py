from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.anomaly import AnomalyResponse
from app.ml.anomaly_detector import detect_anomalies, resolve_anomaly

router = APIRouter(tags=["ML Anomaly Detection"])


@router.get("", response_model=AnomalyResponse)
def get_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates current user's expense transactions through the Isolation Forest
    surveillance engine and statistical deviance models, returning flagged anomalies,
    severity tiers, and explainable AI reasons.
    """
    return detect_anomalies(db=db, user_id=current_user.id)


@router.post("/{transaction_id}/resolve")
def resolve_transaction_anomaly(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks a flagged anomaly as verified/resolved by the user, updating
    surveillance flags so it is no longer surfaced as high risk.
    """
    result = resolve_anomaly(db=db, user_id=current_user.id, transaction_id=transaction_id)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("message", "Transaction not found")
        )
    return result
