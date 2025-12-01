"""
Contact Form Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class ContactRequest(BaseModel):
    """Contact form submission request"""
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    phone: str = Field(default="", max_length=20, description="Phone number (optional)")
    subject: Literal["product_inquiry", "order_support", "delivery", "warranty_return", "partnership", "other"] = Field(
        ..., 
        description="Contact subject category"
    )
    message: str = Field(..., min_length=10, max_length=2000, description="Message content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Nguyễn Văn A",
                "email": "customer@example.com",
                "phone": "0123456789",
                "subject": "product_inquiry",
                "message": "Tôi muốn tư vấn về bộ sofa da cao cấp..."
            }
        }


class ContactResponse(BaseModel):
    """Contact form submission response"""
    success: bool
    message: str
