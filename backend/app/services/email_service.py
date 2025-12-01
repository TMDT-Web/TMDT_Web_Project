"""
Email Service for sending contact form emails
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List
from app.core.config import settings

# Configure logger
logger = logging.getLogger(__name__)


def send_contact_email(contact_data: Dict[str, str]) -> bool:
    """
    Send contact form email to admin
    
    Args:
        contact_data: Dictionary containing name, email, phone, subject, message
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Subject mapping for Vietnamese display
        subject_map = {
            "product_inquiry": "Tư vấn sản phẩm",
            "order_support": "Hỗ trợ đơn hàng",
            "delivery": "Vận chuyển & Lắp đặt",
            "warranty_return": "Bảo hành & Đổi trả",
            "partnership": "Hợp tác kinh doanh",
            "other": "Khác"
        }
        
        subject_display = subject_map.get(contact_data.get("subject", "other"), "Khác")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[LuxeFurniture] Liên hệ mới: {subject_display}"
        # Use SMTP_USER as sender to avoid Gmail blocking/spam classification
        msg['From'] = settings.SMTP_USER or settings.SMTP_FROM
        msg['To'] = settings.ADMIN_EMAIL
        msg['Reply-To'] = contact_data.get("email", "")
        
        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #1E40AF;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                }}
                .field {{
                    margin-bottom: 15px;
                }}
                .field-label {{
                    font-weight: bold;
                    color: #1E40AF;
                }}
                .field-value {{
                    margin-top: 5px;
                    padding: 10px;
                    background-color: white;
                    border-left: 3px solid #1E40AF;
                }}
                .footer {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📧 Liên hệ mới từ Website</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="field-label">Chủ đề:</div>
                        <div class="field-value">{subject_display}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Họ và tên:</div>
                        <div class="field-value">{contact_data.get('name', 'N/A')}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Email:</div>
                        <div class="field-value">{contact_data.get('email', 'N/A')}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Số điện thoại:</div>
                        <div class="field-value">{contact_data.get('phone', 'Không cung cấp')}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Nội dung:</div>
                        <div class="field-value">{contact_data.get('message', 'N/A').replace(chr(10), '<br>')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Email này được gửi tự động từ form liên hệ trên website LuxeFurniture</p>
                    <p>Vui lòng trả lời trực tiếp email của khách hàng: {contact_data.get('email', 'N/A')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML body
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Send email
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print("⚠️  SMTP credentials not configured. Email not sent.")
            print(f"Would have sent email to: {settings.ADMIN_EMAIL}")
            print(f"Subject: {msg['Subject']}")
            return False
            
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        print(f"✓ Contact email sent successfully to {settings.ADMIN_EMAIL}")
        return True
        
    except Exception as e:
        print(f"✗ Error sending contact email: {str(e)}")
        return False


def send_auto_reply_email(contact_data: Dict[str, str]) -> bool:
    """
    Send auto-reply email to customer
    
    Args:
        contact_data: Dictionary containing name, email, phone, subject, message
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        logger.info(f"Attempting to send auto-reply to: {contact_data.get('email')}")

        # Subject mapping for Vietnamese display
        subject_map = {
            "product_inquiry": "Tư vấn sản phẩm",
            "order_support": "Hỗ trợ đơn hàng",
            "delivery": "Vận chuyển & Lắp đặt",
            "warranty_return": "Bảo hành & Đổi trả",
            "partnership": "Hợp tác kinh doanh",
            "other": "Khác"
        }
        
        subject_display = subject_map.get(contact_data.get("subject", "other"), "Khác")
        customer_email = contact_data.get("email")
        
        if not customer_email:
            logger.warning("No customer email provided for auto-reply")
            return False
            
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[LuxeFurniture] Xác nhận liên hệ: {subject_display}"
        msg['From'] = settings.SMTP_USER or settings.SMTP_FROM
        msg['To'] = customer_email
        
        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #1E40AF;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                }}
                .field {{
                    margin-bottom: 15px;
                }}
                .field-label {{
                    font-weight: bold;
                    color: #1E40AF;
                }}
                .field-value {{
                    margin-top: 5px;
                    padding: 10px;
                    background-color: white;
                    border-left: 3px solid #1E40AF;
                }}
                .footer {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Cảm ơn bạn đã liên hệ!</h2>
                </div>
                <div class="content">
                    <p>Xin chào <strong>{contact_data.get('name', 'Quý khách')}</strong>,</p>
                    <p>Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong thời gian sớm nhất.</p>
                    <p>Dưới đây là thông tin bạn đã gửi:</p>
                    
                    <div class="field">
                        <div class="field-label">Chủ đề:</div>
                        <div class="field-value">{subject_display}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Họ và tên:</div>
                        <div class="field-value">{contact_data.get('name', 'N/A')}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Email:</div>
                        <div class="field-value">{contact_data.get('email', 'N/A')}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Số điện thoại:</div>
                        <div class="field-value">{contact_data.get('phone', 'Không cung cấp')}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Nội dung:</div>
                        <div class="field-value">{contact_data.get('message', 'N/A').replace(chr(10), '<br>')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                    <p>LuxeFurniture - Mang đẳng cấp đến ngôi nhà của bạn</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML body
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Send email
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.error("SMTP credentials missing")
            return False
            
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"✓ Auto-reply email sent successfully to {customer_email}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Error sending auto-reply email: {str(e)}")
        return False
