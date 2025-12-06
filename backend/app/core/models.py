"""Aggregate all SQLAlchemy models for Alembic's autogeneration."""

from app.users.models import Role, User, UserAddress, UserRole  # noqa: F401
from app.products.models import (  # noqa: F401
    Category,
    Product,
    ProductImage,
    ProductTag,
    Tag,
)
from app.orders.models import (  # noqa: F401
    Order,
    OrderItem,
    OrderPaymentStatusEnum,
    OrderStatusEnum,
)
from app.cart.models import CartItem  # noqa: F401
from app.inventory.models import (  # noqa: F401
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
)
from app.payments.models import Payment, PaymentGatewayEnum, PaymentStatusEnum  # noqa: F401
from app.rewards.models import PointTransaction, RewardPoint, Voucher, VoucherStatus  # noqa: F401
