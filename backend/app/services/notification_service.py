from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.models import Notification, Budget, Transaction, Goal
from app.schemas.notification import NotificationOut, NotificationListResponse
from app.services.budget_service import get_user_budgets


def evaluate_and_sync_notifications(db: Session, user_id: int):
    """Evaluates active budgets, anomaly flags, and goals, generating proactive notification alerts."""
    # 1. Budget Alerts
    budget_summary = get_user_budgets(db, user_id)
    for b in budget_summary.budgets:
        if b.status == "Exceeded":
            title = f"Budget Exceeded: {b.category}"
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.type == "budget_exceeded"
            ).first()
            if not existing:
                db.add(Notification(
                    user_id=user_id,
                    title=title,
                    message=f"You have spent ${b.spent:,.2f}, exceeding your monthly limit of ${b.monthly_limit:,.2f} for {b.category}.",
                    type="budget_exceeded",
                    is_read=False
                ))
        elif b.status == "Warning":
            title = f"Budget Warning: {b.category}"
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.type == "budget_warning"
            ).first()
            if not existing:
                db.add(Notification(
                    user_id=user_id,
                    title=title,
                    message=f"{b.category} spending has reached {b.percent_used:.1f}% of your ${b.monthly_limit:,.2f} monthly cap.",
                    type="budget_warning",
                    is_read=False
                ))

    # 2. Anomaly Alerts
    anomalous_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.is_anomaly == True,
        Transaction.anomaly_score >= 0.80
    ).all()

    for tx in anomalous_txs[:3]:
        title = f"High Risk Outlier: {tx.merchant or tx.category}"
        existing = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.title == title
        ).first()
        if not existing:
            db.add(Notification(
                user_id=user_id,
                title=title,
                message=f"Isolation Forest detected abnormal spending pattern on {tx.date} (${tx.amount:,.2f}).",
                type="unusual_transaction",
                is_read=False
            ))

    db.commit()


def get_user_notifications(db: Session, user_id: int) -> NotificationListResponse:
    evaluate_and_sync_notifications(db, user_id)

    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    unread_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

    out_list = [
        NotificationOut(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            is_read=n.is_read,
            created_at=n.created_at
        )
        for n in notifications
    ]

    return NotificationListResponse(
        unread_count=unread_count,
        notifications=out_list
    )


def mark_as_read(db: Session, user_id: int, notification_id: int) -> bool:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not notif:
        return False
    notif.is_read = True
    db.commit()
    return True


def mark_all_read(db: Session, user_id: int) -> int:
    updated = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    db.commit()
    return updated
