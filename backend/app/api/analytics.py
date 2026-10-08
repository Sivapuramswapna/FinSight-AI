from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.analytics import AnalyticsResponse
from app.services import analytics_service

router = APIRouter(tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    months: int = Query(6, ge=1, le=24, description="Number of historical months to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_service.get_user_analytics(
        db=db,
        user_id=current_user.id,
        months=months
    )
