"""
Notification Endpoints
"""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's notification preferences"""
    prefs = NotificationService.get_user_preferences(db, current_user.id)
    return prefs


@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    data: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preferences"""
    prefs = NotificationService.update_preferences(
        db,
        current_user.id,
        email_enabled=data.email_enabled,
        sms_enabled=data.sms_enabled,
        push_enabled=data.push_enabled,
        order_updates=data.order_updates,
        promotions=data.promotions
    )
    return prefs


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    notifications = NotificationService.get_user_notifications(
        db,
        current_user.id,
        limit=limit,
        unread_only=unread_only
    )
    return notifications


@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    success = NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not success:
        return {"message": "Notification not found", "success": False}
    return {"message": "Notification marked as read", "success": True}


@router.post("/push/subscribe", response_model=PushSubscriptionResponse, status_code=status.HTTP_201_CREATED)
def subscribe_push(
    data: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to push notifications"""
    subscription = NotificationService.add_push_subscription(
        db,
        user_id=current_user.id,
        endpoint=data.endpoint,
        p256dh=data.p256dh,
        auth=data.auth,
        user_agent=data.user_agent
    )
    return subscription


@router.post("/test-email", status_code=status.HTTP_200_OK)
async def send_test_email(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a test notification email to current user"""
    notification = await NotificationService.send_notification(
        db=db,
        user_id=current_user.id,
        event_type="TEST_EMAIL",
        title="[Luxe Furniture] Thử gửi email thành công",
        message=(
            f"Xin chào {current_user.full_name or current_user.email},<br/><br/>"
            "Đây là email thử nghiệm từ hệ thống thông báo Luxe Furniture.\n"
            "Nếu bạn nhận được email này, kênh Email đã hoạt động đúng.\n<br/><br/>"
            "Cảm ơn bạn!"
        ),
        data={"test": True},
        category="order_updates"
    )
    return {"success": True, "notification_id": notification.id}
