# Import all models to ensure they are registered with SQLAlchemy
from .identity import User, UserProfile, Address, Consent
from .shop import Shop, PayoutAccount
from .catalog import Category, Attribute, CategoryAttribute, Listing, ListingVariant, Media, PriceHistory
from .order import Order, OrderItem, Return
from .payment import Payment, Refund, FeeRule, LedgerAccount, LedgerJournal, LedgerPosting, Settlement, Payout
from .messaging import Conversation, ConversationParticipant, Message
from .review import Review, ReviewHelpfulness
from .promotion import Voucher, VoucherRedemption
from .trust_safety import ModerationQueue, Dispute
from .notification import NotificationTemplate, Notification
from .analytics import DomainEvent
from .fulfillment import Shipment

# Export all models
__all__ = [
    # Identity
    "User", "UserProfile", "Address", "Consent",
    # Shop
    "Shop", "PayoutAccount",
    # Catalog
    "Category", "Attribute", "CategoryAttribute", "Listing", "ListingVariant", "Media", "PriceHistory",
    # Order
    "Order", "OrderItem", "Return",
    # Payment
    "Payment", "Refund", "FeeRule", "LedgerAccount", "LedgerJournal", "LedgerPosting", "Settlement", "Payout",
    # Messaging
    "Conversation", "ConversationParticipant", "Message",
    # Review
    "Review", "ReviewHelpfulness",
    # Promotion
    "Voucher", "VoucherRedemption",
    # Trust & Safety
    "ModerationQueue", "Dispute",
    # Notification
    "NotificationTemplate", "Notification",
    # Analytics
    "DomainEvent",
    # Fulfillment
    "Shipment",
]
