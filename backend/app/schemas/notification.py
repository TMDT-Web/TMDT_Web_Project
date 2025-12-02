"""
Notification Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationPreferenceBase(BaseModel):
    """Base notification preference schema"""
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = False
    order_updates: bool = True
    promotions: bool = True


class NotificationPreferenceUpdate(NotificationPreferenceBase):
    """Update notification preferences"""
    pass


class NotificationPreferenceResponse(NotificationPreferenceBase):
    """Notification preference response"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    """Base notification schema"""
    event_type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class NotificationResponse(NotificationBase):
    """Notification response"""
    id: int
    user_id: int
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PushSubscriptionCreate(BaseModel):
    """Create push subscription"""
    endpoint: str
    p256dh: str = Field(..., description="Encryption key")
    auth: str = Field(..., description="Auth secret")
    user_agent: Optional[str] = None


class PushSubscriptionResponse(BaseModel):
    """Push subscription response"""
    id: int
    user_id: int
    endpoint: str
    created_at: datetime
    
    class Config:
        from_attributes = True
