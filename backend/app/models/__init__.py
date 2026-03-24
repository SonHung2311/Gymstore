# Import all models so Alembic autogenerate can discover them
from app.models.user import User
from app.models.product import AttributeType, Category, Product, ProductAttribute, ProductReview, ProductVariant
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.community import Post, Comment, Like
from app.models.banner import Banner
from app.models.voucher import Voucher, VoucherUsage
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.tag import Tag

__all__ = [
    "User",
    "AttributeType", "Category", "Product", "ProductAttribute", "ProductReview", "ProductVariant",
    "CartItem", "Order", "OrderItem",
    "Post", "Comment", "Like",
    "Banner",
    "Voucher", "VoucherUsage",
    "Conversation", "ConversationParticipant", "Message",
    "Tag",
]
