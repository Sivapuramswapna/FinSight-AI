from datetime import datetime
from typing import List
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str  # 'budget_warning' | 'anomaly_alert' | 'goal_milestone' | 'general'
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    unread_count: int
    notifications: List[NotificationOut]
