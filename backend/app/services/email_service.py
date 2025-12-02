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


def send_order_confirmation_email(to_email: str, user_name: str, order_id: int, total_amount: float, payment_method: str = "QR Payment", coupon_code: str = None) -> bool:
    """
    Send order confirmation email after successful payment
    
    Args:
        to_email: Customer email address
        user_name: Customer name
        order_id: Order ID
        total_amount: Total order amount
        payment_method: Payment method used
        coupon_code: Promotional coupon code (if generated)
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        logger.info(f"Sending order confirmation email to: {to_email}")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[LuxeFurniture] Xác nhận thanh toán đơn hàng #{order_id}"
        msg['From'] = settings.SMTP_USER or settings.SMTP_FROM
        msg['To'] = to_email
        
        # Format amount in VND
        formatted_amount = f"{total_amount:,.0f}đ"
        
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
                    background-color: #10B981;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                }}
                .success-icon {{
                    font-size: 48px;
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .order-info {{
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #10B981;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .label {{
                    font-weight: bold;
                    color: #666;
                }}
                .value {{
                    color: #333;
                }}
                .total {{
                    font-size: 24px;
                    color: #10B981;
                    font-weight: bold;
                }}
                .footer {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #1E40AF;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>✓ Thanh toán thành công!</h2>
                </div>
                <div class="content">
                    <div class="success-icon">🎉</div>
                    
                    <p>Xin chào <strong>{user_name}</strong>,</p>
                    <p>Cảm ơn bạn đã thanh toán! Đơn hàng của bạn đã được xác nhận thành công.</p>
                    
                    <div class="order-info">
                        <div class="info-row">
                            <span class="label">Mã đơn hàng:</span>
                            <span class="value">#{order_id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Phương thức thanh toán:</span>
                            <span class="value">{payment_method}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Tổng tiền:</span>
                            <span class="value total">{formatted_amount}</span>
                        </div>
                    </div>
                    
                    <p>Chúng tôi sẽ xử lý đơn hàng của bạn ngay lập tức và thông báo khi hàng được giao.</p>
                    
                    {"" if not coupon_code else f'''
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                padding: 20px; 
                                border-radius: 10px; 
                                margin: 20px 0;
                                text-align: center;
                                color: white;">
                        <h3 style="margin: 0 0 10px 0; color: white;">🎁 Quà tặng đặc biệt!</h3>
                        <p style="margin: 10px 0; font-size: 14px;">Cảm ơn bạn đã mua hàng trên 8 triệu đồng!</p>
                        <div style="background: white;
                                    color: #764ba2;
                                    padding: 15px;
                                    border-radius: 8px;
                                    margin: 15px 0;
                                    font-size: 24px;
                                    font-weight: bold;
                                    letter-spacing: 2px;">
                            {coupon_code}
                        </div>
                        <p style="margin: 10px 0; font-size: 14px;">Mã giảm giá 300.000đ cho đơn hàng tiếp theo</p>
                        <p style="margin: 5px 0; font-size: 12px; opacity: 0.9;">Có hiệu lực trong 30 ngày</p>
                    </div>
                    '''}
                    
                    <div style="text-align: center;">
                        <a href="{settings.FRONTEND_BASE_URL}/orders/{order_id}" class="button">Xem chi tiết đơn hàng</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                    <p>Nếu có thắc mắc, vui lòng liên hệ: {settings.ADMIN_EMAIL}</p>
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
            logger.warning("SMTP credentials not configured. Email not sent.")
            return False
            
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"✓ Order confirmation email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Error sending order confirmation email: {str(e)}")
        return False
