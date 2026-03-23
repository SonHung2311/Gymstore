from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.cart import CartItem
from app.models.voucher import Voucher, VoucherUsage


def _get_active_voucher(db: Session, code: str) -> Voucher:
    """Fetch voucher by code and validate basic status. Raises ValueError on failure."""
    voucher = db.query(Voucher).filter(Voucher.code == code.strip().upper()).first()
    if not voucher:
        raise ValueError("Mã giảm giá không tồn tại")
    if not voucher.is_active:
        raise ValueError("Mã giảm giá đã bị vô hiệu hoá")

    now = datetime.now(timezone.utc)
    if voucher.valid_from and now < voucher.valid_from.replace(tzinfo=timezone.utc):
        raise ValueError("Mã giảm giá chưa có hiệu lực")
    if voucher.valid_until and now > voucher.valid_until.replace(tzinfo=timezone.utc):
        raise ValueError("Mã giảm giá đã hết hạn")
    if voucher.usage_limit is not None and voucher.usage_count >= voucher.usage_limit:
        raise ValueError("Mã giảm giá đã đạt giới hạn sử dụng")

    return voucher


def _compute_discount(voucher: Voucher, eligible_total: float) -> float:
    if eligible_total <= 0:
        return 0.0
    if voucher.discount_type == "percent":
        raw = eligible_total * float(voucher.discount_value) / 100
        if voucher.max_discount_amount:
            raw = min(raw, float(voucher.max_discount_amount))
        return round(min(raw, eligible_total), 2)
    else:  # fixed
        return round(min(float(voucher.discount_value), eligible_total), 2)


def validate_voucher(
    db: Session,
    code: str,
    user_id: str,
    cart_items: list[CartItem],
) -> tuple["Voucher", float]:
    """
    Validate a voucher code against the user's cart.
    Returns (voucher, discount_amount). Raises ValueError with a Vietnamese message on failure.
    """
    voucher = _get_active_voucher(db, code)

    # Per-user usage check
    user_usage_count = (
        db.query(VoucherUsage)
        .filter(VoucherUsage.voucher_id == voucher.id, VoucherUsage.user_id == user_id)
        .count()
    )
    if user_usage_count >= voucher.per_user_limit:
        raise ValueError("Bạn đã sử dụng mã giảm giá này rồi")

    # Compute eligible total based on applies_to scope
    eligible_total = 0.0
    for ci in cart_items:
        product = ci.product
        if voucher.applies_to == "all":
            eligible_total += float(product.price) * ci.quantity
        elif voucher.applies_to == "category" and product.category_id == voucher.category_id:
            eligible_total += float(product.price) * ci.quantity
        elif voucher.applies_to == "product" and product.id == voucher.product_id:
            eligible_total += float(product.price) * ci.quantity

    if voucher.min_order_amount and eligible_total < float(voucher.min_order_amount):
        raise ValueError(
            f"Đơn hàng tối thiểu {float(voucher.min_order_amount):,.0f}₫ để áp dụng mã này"
        )

    discount = _compute_discount(voucher, eligible_total)
    return voucher, discount


def record_usage(db: Session, voucher: Voucher, user_id: str, order_id: str) -> None:
    usage = VoucherUsage(voucher_id=voucher.id, user_id=user_id, order_id=order_id)
    db.add(usage)
    voucher.usage_count += 1
