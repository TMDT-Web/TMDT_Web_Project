"""
Notification Service - Multi-channel notification delivery
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

from app.models.notification import (
    Notification,
    NotificationLog,
    UserNotificationPreference,
    PushSubscription
)
from app.models.user import User
from app.core.config import settings


class NotificationService:
    """Service for managing multi-channel notifications"""
    
    @staticmethod
    def get_user_preferences(db: Session, user_id: int) -> UserNotificationPreference:
        """Get or create user notification preferences"""
        prefs = db.query(UserNotificationPreference).filter(
            UserNotificationPreference.user_id == user_id
        ).first()
        
        if not prefs:
            prefs = UserNotificationPreference(
                user_id=user_id,
                email_enabled=True,
                sms_enabled=False,
                push_enabled=False,
                order_updates=True,
                promotions=True
            )
            db.add(prefs)
            db.commit()
            db.refresh(prefs)
        
        return prefs
    
    @staticmethod
    def update_preferences(
        db: Session,
        user_id: int,
        **kwargs
    ) -> UserNotificationPreference:
        """Update user notification preferences"""
        prefs = NotificationService.get_user_preferences(db, user_id)
        
        for key, value in kwargs.items():
            if hasattr(prefs, key):
                setattr(prefs, key, value)
        
        db.commit()
        db.refresh(prefs)
        return prefs
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        event_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: str = "order_updates",
        channels: Optional[List[str]] = None,
        email_subject: Optional[str] = None,
        email_body: Optional[str] = None,
        email_to: Optional[str] = None
    ) -> Notification:
        """
        Create a notification record and send through specified channels
        
        Args:
            db: Database session
            user_id: Target user ID
            event_type: Type of notification
            title: Notification title
            message: Short notification message
            data: Additional data
            category: Notification category (order_updates or promotions)
            channels: List of channels to send through (e.g., ["email", "sms"])
            email_subject: Custom email subject (overrides title)
            email_body: Custom HTML email body (overrides message)
            email_to: Custom recipient email (overrides user.email)
        """
        # Create notification record
        notification = Notification(
            user_id=user_id,
            event_type=event_type,
            title=title,
            message=message,
            data=data
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Send through specified channels
        if channels:
            if "email" in channels:
                NotificationService._send_email_sync(
                    db=db,
                    notification=notification,
                    user_id=user_id,
                    email_subject=email_subject or title,
                    email_body=email_body or message,
                    email_to=email_to
                )
        
        return notification
    
    @staticmethod
    async def send_notification(
        db: Session,
        user_id: int,
        event_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: str = "order_updates"  # or "promotions"
    ) -> Notification:
        """
        Send notification through enabled channels
        
        Args:
            db: Database session
            user_id: Target user ID
            event_type: Type of notification (ORDER_CONFIRMED, ORDER_SHIPPED, etc.)
            title: Notification title
            message: Notification message
            data: Additional data
            category: Notification category (order_updates or promotions)
        """
        # Get user and preferences
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        prefs = NotificationService.get_user_preferences(db, user_id)
        
        # Check if user wants this category
        if category == "order_updates" and not prefs.order_updates:
            return None
        if category == "promotions" and not prefs.promotions:
            return None
        
        # Create notification record
        notification = NotificationService.create_notification(
            db, user_id, event_type, title, message, data
        )
        
        # Send through enabled channels
        if prefs.email_enabled:
            await NotificationService._send_email(db, notification, user)
        
        if prefs.sms_enabled and user.phone:
            await NotificationService._send_sms(db, notification, user)
        
        if prefs.push_enabled:
            await NotificationService._send_push(db, notification, user)
        
        return notification
    
    @staticmethod
    async def _send_email(db: Session, notification: Notification, user: User) -> None:
        """Send email notification"""
        log = NotificationLog(
            notification_id=notification.id,
            channel="email",
            status="pending"
        )
        db.add(log)
        db.commit()
        
        try:
            if settings.SENDGRID_API_KEY:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail

                message = Mail(
                    from_email=(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                    to_emails=user.email,
                    subject=notification.title,
                    html_content=notification.message
                )

                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                response = sg.send(message)

                log.status = "sent"
                log.sent_at = datetime.utcnow()
                log.provider_response = f"SendGrid Status: {response.status_code}"
            else:
                # SMTP sending using configured credentials
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText

                smtp_host = settings.SMTP_HOST
                smtp_port = settings.SMTP_PORT
                smtp_user = settings.SMTP_USER
                smtp_password = settings.SMTP_PASSWORD
                smtp_from = settings.SMTP_FROM or settings.SENDGRID_FROM_EMAIL

                if not smtp_host or not smtp_port:
                    raise RuntimeError("SMTP not configured")

                # Build email
                msg = MIMEMultipart('alternative')
                msg['Subject'] = notification.title
                msg['From'] = smtp_from
                msg['To'] = user.email

                # Plain text fallback
                text_part = MIMEText(notification.message, 'plain', 'utf-8')
                html_part = MIMEText(notification.message, 'html', 'utf-8')
                msg.attach(text_part)
                msg.attach(html_part)

                # Connect and send (auto switch SSL when port 465)
                if int(smtp_port) == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                        if smtp_user and smtp_password:
                            # Login only if credentials are provided
                            if smtp_user and smtp_password:
                                server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [user.email], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.ehlo()
                        # Use TLS for standard ports like 587
                        try:
                            server.starttls()
                            server.ehlo()
                        except Exception as tls_err:
                            # Record TLS error but continue if server doesn't support STARTTLS
                            pass

                        if smtp_user and smtp_password:
                            # Login only if credentials are provided
                            if smtp_user and smtp_password:
                                server.login(smtp_user, smtp_password)

                        server.sendmail(smtp_from, [user.email], msg.as_string())

                log.status = "sent"
                log.sent_at = datetime.utcnow()
                log.provider_response = f"SMTP sent to {user.email} via {smtp_host}:{smtp_port}"
        except Exception as e:
            log.status = "failed"
            log.provider_response = f"SMTP error: {e}"
        
        db.commit()
    
    @staticmethod
    def _send_email_sync(
        db: Session,
        notification: Notification,
        user_id: int,
        email_subject: str,
        email_body: str,
        email_to: Optional[str] = None
    ) -> None:
        """Send email notification synchronously (for order notifications)"""
        log = NotificationLog(
            notification_id=notification.id,
            channel="email",
            status="pending"
        )
        db.add(log)
        db.commit()
        
        try:
            # Get user if email_to not specified
            if not email_to:
                user = db.query(User).filter(User.id == user_id).first()
                if not user or not user.email:
                    raise ValueError(f"User {user_id} has no email")
                email_to = user.email
            
            # Check user preferences
            prefs = NotificationService.get_user_preferences(db, user_id)
            if not prefs.email_enabled or not prefs.order_updates:
                log.status = "skipped"
                log.provider_response = "Email disabled in user preferences"
                db.commit()
                return
            
            if settings.SENDGRID_API_KEY:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail

                message = Mail(
                    from_email=(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                    to_emails=email_to,
                    subject=email_subject,
                    html_content=email_body
                )

                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                response = sg.send(message)

                log.status = "sent"
                log.sent_at = datetime.utcnow()
                log.provider_response = f"SendGrid Status: {response.status_code}"
            else:
                # SMTP sending
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText

                smtp_host = settings.SMTP_HOST
                smtp_port = settings.SMTP_PORT
                smtp_user = settings.SMTP_USER
                smtp_password = settings.SMTP_PASSWORD
                smtp_from = settings.SMTP_FROM or settings.SENDGRID_FROM_EMAIL

                if not smtp_host or not smtp_port:
                    raise RuntimeError("SMTP not configured")

                # Build email
                msg = MIMEMultipart('alternative')
                msg['Subject'] = email_subject
                msg['From'] = smtp_from
                msg['To'] = email_to

                # Plain text fallback
                text_part = MIMEText(email_body, 'plain', 'utf-8')
                html_part = MIMEText(email_body, 'html', 'utf-8')
                msg.attach(text_part)
                msg.attach(html_part)

                # Connect and send
                if int(smtp_port) == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                        if smtp_user and smtp_password:
                            server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [email_to], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.ehlo()
                        try:
                            server.starttls()
                            server.ehlo()
                        except Exception:
                            pass
                        if smtp_user and smtp_password:
                            server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [email_to], msg.as_string())

                log.status = "sent"
                log.sent_at = datetime.utcnow()
                log.provider_response = f"SMTP sent to {email_to} via {smtp_host}:{smtp_port}"
        except Exception as e:
            log.status = "failed"
            log.provider_response = f"Email error: {str(e)}"
            print(f"Failed to send email notification: {str(e)}")
        
        db.commit()
    
    @staticmethod
    async def _send_sms(db: Session, notification: Notification, user: User) -> None:
        """Send SMS notification"""
        log = NotificationLog(
            notification_id=notification.id,
            channel="sms",
            status="pending"
        )
        db.add(log)
        db.commit()
        
        try:
            if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
                from twilio.rest import Client
                
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                
                message = client.messages.create(
                    body=f"{notification.title}\n\n{notification.message}",
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=user.phone
                )
                
                log.status = "sent"
                log.sent_at = datetime.utcnow()
                log.provider_response = f"SID: {message.sid}"
            else:
                log.status = "sent"
                log.sent_at = datetime.utcnow()
                log.provider_response = "Twilio not configured - skipped"
        except Exception as e:
            log.status = "failed"
            log.provider_response = str(e)
        
        db.commit()
    
    @staticmethod
    async def _send_push(db: Session, notification: Notification, user: User) -> None:
        """Send web push notification"""
        subscriptions = db.query(PushSubscription).filter(
            PushSubscription.user_id == user.id
        ).all()
        
        for subscription in subscriptions:
            log = NotificationLog(
                notification_id=notification.id,
                channel="push",
                status="pending"
            )
            db.add(log)
            db.commit()
            
            try:
                if settings.VAPID_PRIVATE_KEY:
                    from pywebpush import webpush, WebPushException
                    
                    payload = json.dumps({
                        "title": notification.title,
                        "body": notification.message,
                        "data": notification.data or {}
                    })
                    
                    webpush(
                        subscription_info={
                            "endpoint": subscription.endpoint,
                            "keys": {
                                "p256dh": subscription.p256dh,
                                "auth": subscription.auth
                            }
                        },
                        data=payload,
                        vapid_private_key=settings.VAPID_PRIVATE_KEY,
                        vapid_claims={
                            "sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"
                        }
                    )
                    
                    log.status = "sent"
                    log.sent_at = datetime.utcnow()
                    log.provider_response = "Push sent"
                else:
                    log.status = "sent"
                    log.sent_at = datetime.utcnow()
                    log.provider_response = "VAPID not configured - skipped"
            except Exception as e:
                log.status = "failed"
                log.provider_response = str(e)
                
                # Remove invalid subscription
                if "410" in str(e) or "404" in str(e):
                    db.delete(subscription)
            
            db.commit()
    
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        """Get user notifications"""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.read == False)
        
        return query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.read = True
            db.commit()
            return True
        return False
    
    @staticmethod
    def add_push_subscription(
        db: Session,
        user_id: int,
        endpoint: str,
        p256dh: str,
        auth: str,
        user_agent: Optional[str] = None
    ) -> PushSubscription:
        """Add or update push subscription"""
        # Check if subscription exists
        existing = db.query(PushSubscription).filter(
            PushSubscription.endpoint == endpoint
        ).first()
        
        if existing:
            existing.user_id = user_id
            existing.p256dh = p256dh
            existing.auth = auth
            existing.user_agent = user_agent
            db.commit()
            db.refresh(existing)
            return existing
        
        subscription = PushSubscription(
            user_id=user_id,
            endpoint=endpoint,
            p256dh=p256dh,
            auth=auth,
            user_agent=user_agent
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription
