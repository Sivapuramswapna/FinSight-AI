from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.notification import NotificationListResponse
from app.services.notification_service import (
    get_user_notifications,
    mark_as_read,
    mark_all_read
)

router = APIRouter(tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns active notification alerts and unread count."""
    return get_user_notifications(db=db, user_id=current_user.id)


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks all user notifications as read."""
    count = mark_all_read(db=db, user_id=current_user.id)
    return {"message": "All notifications marked as read", "updated_count": count}


@router.put("/{notification_id}/read")
def mark_single_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks a single notification as read."""
    success = mark_as_read(db=db, user_id=current_user.id, notification_id=notification_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"message": "Notification marked as read", "id": notification_id}
