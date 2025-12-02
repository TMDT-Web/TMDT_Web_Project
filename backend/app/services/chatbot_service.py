"""
Chatbot Service - AI-powered automatic responses
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
import re
from datetime import datetime

from app.models.chat import ChatSession, ChatMessage, MessageSender, ChatStatus
from app.models.user import User


class ChatbotService:
    """Service for handling chatbot automatic responses"""
    
    # FAQ Database - Câu hỏi thường gặp
    FAQ_PATTERNS = {
        # Chào hỏi
        r'(xin chào|chào|hello|hi|hey)': {
            'response': 'Xin chào! Tôi là trợ lý ảo của LuxeFurniture. Tôi có thể giúp gì cho bạn?\n\nBạn có thể hỏi về:\n- Sản phẩm và giá cả\n- Chính sách vận chuyển\n- Chính sách đổi trả\n- Thanh toán\n- Khuyến mãi',
            'keywords': ['xin chào', 'chào', 'hello', 'hi']
        },
        
        # Giờ làm việc
        r'(giờ làm việc|mở cửa|đóng cửa|thời gian)': {
            'response': 'Giờ làm việc của chúng tôi:\n- Thứ 2 - Thứ 6: 8:00 - 20:00\n- Thứ 7 - Chủ nhật: 9:00 - 21:00\n\nHotline hỗ trợ 24/7: 1900-xxxx',
            'keywords': ['giờ làm việc', 'mở cửa', 'đóng cửa']
        },
        
        # Vận chuyển
        r'(vận chuyển|giao hàng|ship|delivery)': {
            'response': 'Chính sách vận chuyển:\n\n1. Miễn phí ship nội thành cho đơn > 10 triệu\n2. Giao hàng toàn quốc (3-7 ngày)\n3. Kiểm tra hàng trước khi nhận\n4. Đội ngũ vận chuyển chuyên nghiệp\n\nBạn có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi"',
            'keywords': ['vận chuyển', 'giao hàng', 'ship']
        },
        
        # Thanh toán
        r'(thanh toán|payment|pay|trả tiền)': {
            'response': 'Phương thức thanh toán:\n\n1. Thanh toán khi nhận hàng (COD)\n2. Chuyển khoản ngân hàng\n3. Quét mã QR\n4. Ví điện tử (Momo, VNPay)\n\nTất cả đều an toàn và bảo mật!',
            'keywords': ['thanh toán', 'payment', 'trả tiền']
        },
        
        # Đổi trả
        r'(đổi trả|hoàn trả|return|refund)': {
            'response': 'Chính sách đổi trả:\n\n1. Đổi trả trong 7 ngày nếu lỗi nhà sản xuất\n2. Sản phẩm còn nguyên vẹn, chưa qua sử dụng\n3. Có hóa đơn mua hàng\n4. Miễn phí vận chuyển đổi trả\n\nVui lòng liên hệ hotline để được hỗ trợ!',
            'keywords': ['đổi trả', 'hoàn trả', 'return']
        },
        
        # Giá cả
        r'(giá|price|bao nhiêu tiền|cost)': {
            'response': 'Về giá cả:\n\nSản phẩm của chúng tôi có mức giá đa dạng từ 5 triệu đến 50 triệu tùy loại.\n\nBạn có thể:\n- Xem chi tiết giá trên từng sản phẩm\n- Thành viên VIP được giảm 5-15%\n- Khuyến mãi đặc biệt vào cuối tuần\n\nBạn quan tâm loại nội thất nào ạ?',
            'keywords': ['giá', 'price', 'bao nhiêu']
        },
        
        # Sản phẩm
        r'(sản phẩm|product|có những loại nào|catalog)': {
            'response': 'Danh mục sản phẩm:\n\n1. Sofa (Ghế sofa cao cấp)\n2. Giường ngủ (Bed)\n3. Bàn ăn (Dining Table)\n4. Tủ quần áo (Wardrobe)\n5. Bàn làm việc\n6. Kệ tivi\n\nBạn muốn xem loại nào? Tôi có thể tư vấn chi tiết!',
            'keywords': ['sản phẩm', 'product', 'catalog']
        },
        
        # Khuyến mãi
        r'(khuyến mãi|giảm giá|sale|promotion|discount)': {
            'response': 'Khuyến mãi hiện tại:\n\n- Giảm 15% cho thành viên DIAMOND\n- Flash sale cuối tuần\n- Mua 2 tặng 1 phụ kiện\n- Miễn phí lắp đặt\n\nĐăng ký thành viên để nhận ưu đãi độc quyền!',
            'keywords': ['khuyến mãi', 'giảm giá', 'sale']
        },
        
        # Bảo hành
        r'(bảo hành|warranty|guarantee)': {
            'response': 'Chính sách bảo hành:\n\n- Bảo hành 2-5 năm tùy sản phẩm\n- Bảo hành chính hãng 100%\n- Hỗ trợ sửa chữa miễn phí\n- Đổi mới nếu lỗi từ nhà sản xuất\n\nChứng nhận bảo hành kèm theo hóa đơn.',
            'keywords': ['bảo hành', 'warranty']
        },
        
        # Liên hệ
        r'(liên hệ|contact|phone|số điện thoại|email)': {
            'response': 'Thông tin liên hệ:\n\nHotline: 1900-xxxx\nEmail: support@luxefurniture.com\nFacebook: fb.com/luxefurniture\n\nShowroom:\n- HN: 123 Đường ABC, Cầu Giấy\n- HCM: 456 Đường XYZ, Quận 1\n\nRất vui được phục vụ bạn!',
            'keywords': ['liên hệ', 'contact', 'phone']
        },
        
        # Cảm ơn
        r'(cảm ơn|thanks|thank you|cám ơn)': {
            'response': 'Rất vui được hỗ trợ bạn! Nếu còn thắc mắc gì, đừng ngại hỏi nhé!\n\nChúc bạn mua sắm vui vẻ!',
            'keywords': ['cảm ơn', 'thanks']
        },
    }
    
    # Default response khi không match
    DEFAULT_RESPONSE = """Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn.

Bạn có thể hỏi tôi về:
• Sản phẩm và giá cả
• Vận chuyển & giao hàng
• Thanh toán
• Đổi trả & bảo hành
• Khuyến mãi

Hoặc gõ "trợ giúp" để xem danh sách câu hỏi thường gặp."""

    @staticmethod
    def get_bot_response(message: str) -> str:
        """
        Get automatic response based on user message
        Uses pattern matching for Vietnamese FAQ
        """
        message_lower = message.lower().strip()
        
        # Check if asking for help
        if any(word in message_lower for word in ['trợ giúp', 'help', 'menu', 'hướng dẫn']):
            return """📋 Danh sách câu hỏi thường gặp:

1️⃣ Giờ làm việc
2️⃣ Vận chuyển
3️⃣ Thanh toán
4️⃣ Đổi trả
5️⃣ Bảo hành
6️⃣ Sản phẩm
7️⃣ Giá cả
8️⃣ Khuyến mãi
9️⃣ Liên hệ

Gõ số hoặc từ khóa để biết thêm chi tiết!"""
        
        # Try to match patterns
        for pattern, info in ChatbotService.FAQ_PATTERNS.items():
            if re.search(pattern, message_lower, re.IGNORECASE):
                return info['response']
        
        # No match found
        return ChatbotService.DEFAULT_RESPONSE
    
    @staticmethod
    def create_session(db: Session, user_id: Optional[int] = None) -> ChatSession:
        """Create a new chat session"""
        import uuid
        session_id = f"chat_{uuid.uuid4().hex[:16]}"
        
        session = ChatSession(
            user_id=user_id,
            session_id=session_id,
            status=ChatStatus.ACTIVE
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Send welcome message with FAQ keywords
        welcome_msg = ChatMessage(
            session_id=session.id,
            sender=MessageSender.SYSTEM,
            message="""Xin chào! Tôi là trợ lý ảo của LuxeFurniture. Tôi có thể giúp gì cho bạn?

Bạn có thể hỏi tôi về:
• Giờ làm việc
• Vận chuyển & giao hàng
• Thanh toán (COD, QR, Momo, VNPay)
• Đổi trả & bảo hành
• Sản phẩm & danh mục
• Giá cả
• Khuyến mãi & giảm giá
• Liên hệ & địa chỉ

Gõ từ khóa hoặc câu hỏi của bạn, tôi sẽ trả lời ngay!
Hoặc gõ "trợ giúp" để xem chi tiết.""",
            is_read=False
        )
        db.add(welcome_msg)
        db.commit()
        
        return session
    
    @staticmethod
    def send_message(
        db: Session,
        session_id: int,
        message: str,
        sender: MessageSender = MessageSender.USER,
        sender_id: Optional[int] = None
    ) -> Dict:
        """
        Send a message and get automatic response if from user
        Returns both user message and bot response
        """
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            sender=sender,
            sender_id=sender_id,
            message=message,
            is_read=False
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)
        
        result = {
            'user_message': {
                'id': user_msg.id,
                'message': user_msg.message,
                'sender': user_msg.sender.value,
                'created_at': user_msg.created_at.isoformat()
            }
        }
        
        # If message from user, generate bot response
        if sender == MessageSender.USER:
            bot_response = ChatbotService.get_bot_response(message)
            
            bot_msg = ChatMessage(
                session_id=session_id,
                sender=MessageSender.SYSTEM,
                message=bot_response,
                is_read=False
            )
            db.add(bot_msg)
            db.commit()
            db.refresh(bot_msg)
            
            result['bot_message'] = {
                'id': bot_msg.id,
                'message': bot_msg.message,
                'sender': bot_msg.sender.value,
                'created_at': bot_msg.created_at.isoformat()
            }
        
        return result
    
    @staticmethod
    def get_session_by_session_id(db: Session, session_id: str) -> Optional[ChatSession]:
        """Get session by session_id string"""
        return db.query(ChatSession).filter(
            ChatSession.session_id == session_id
        ).first()
    
    @staticmethod
    def get_session_messages(db: Session, session_id: int) -> List[ChatMessage]:
        """Get all messages for a session"""
        return db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.asc()).all()
    
    @staticmethod
    def get_or_create_user_session(db: Session, user_id: int) -> ChatSession:
        """Get existing active session or create new one for user"""
        session = db.query(ChatSession).filter(
            ChatSession.user_id == user_id,
            ChatSession.status == ChatStatus.ACTIVE
        ).first()
        
        if not session:
            session = ChatbotService.create_session(db, user_id)
        
        return session
