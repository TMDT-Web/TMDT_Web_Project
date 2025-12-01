"""
Contact Form API Endpoints
"""
from fastapi import APIRouter, HTTPException
from app.schemas.contact import ContactRequest, ContactResponse
from app.services.email_service import send_contact_email, send_auto_reply_email

router = APIRouter()


@router.post("", response_model=ContactResponse, status_code=200)
async def submit_contact_form(contact: ContactRequest):
    """
    Submit contact form and send email to admin
    
    Public endpoint - no authentication required
    """
    try:
        # Convert to dict for email service
        contact_data = {
            "name": contact.name,
            "email": contact.email,
            "phone": contact.phone,
            "subject": contact.subject,
            "message": contact.message
        }
        
        # Send email to admin
        send_contact_email(contact_data)
        
        # Send auto-reply to customer
        send_auto_reply_email(contact_data)
        
        return ContactResponse(
            success=True,
            message="Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất."
        )
        
    except Exception as e:
        print(f"Error in contact form submission: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Đã có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau."
        )
