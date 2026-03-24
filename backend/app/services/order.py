from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product, ProductVariant
from app.schemas.order import CheckoutRequest
from app.services.voucher import record_usage, validate_voucher


def checkout(db: Session, user_id: str, data: CheckoutRequest) -> Order:
    """
    Create an order from the user's cart:
    1. Validate all items are in stock
    2. Create Order + OrderItems
    3. Decrement stock
    4. Clear user's cart
    """
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    if not cart_items:
        raise ValueError("Cart is empty")

    # Batch-load all products at once (avoids N+1 across validation + total + creation loops)
    product_ids = [ci.product_id for ci in cart_items]
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()}

    # Validate stock for all items first (atomic check)
    for ci in cart_items:
        product = products.get(ci.product_id)
        if product is None or not product.is_active:
            raise ValueError(f"Product {ci.product_id} is unavailable")
        if ci.variant_id and ci.variant:
            if ci.variant.stock_quantity < ci.quantity:
                raise ValueError(f"Insufficient stock for {product.name} (selected variant)")
        elif product.stock_quantity < ci.quantity:
            raise ValueError(f"Insufficient stock for {product.name}")

    gross_total = sum(
        float(ci.variant.price if ci.variant and ci.variant.price is not None else products[ci.product_id].price) * ci.quantity
        for ci in cart_items
    )

    # Voucher validation
    discount_amount = 0.0
    voucher = None
    if data.coupon_code:
        try:
            voucher, discount_amount = validate_voucher(db, data.coupon_code, user_id, cart_items)
        except ValueError:
            raise  # Propagate to router → 400

    net_total = round(gross_total - discount_amount, 2)

    order = Order(
        user_id=user_id,
        total_amount=net_total,
        payment_method=data.payment_method,
        payment_status="unpaid",
        shipping_address=data.shipping_address.model_dump(),
        note=data.note,
        coupon_code=data.coupon_code.strip().upper() if data.coupon_code else None,
        discount_amount=discount_amount,
    )
    db.add(order)
    db.flush()  # Get order.id without committing

    for ci in cart_items:
        product = products[ci.product_id]
        # Use variant price if set, otherwise product price
        unit_price = float(
            ci.variant.price if ci.variant and ci.variant.price is not None else product.price
        )
        variant_attrs_snapshot = dict(ci.variant.attributes) if ci.variant else None

        db.add(OrderItem(
            order=order,
            product=product,
            variant_id=ci.variant_id,
            variant_attributes=variant_attrs_snapshot,
            quantity=ci.quantity,
            unit_price=unit_price,
            subtotal=round(unit_price * ci.quantity, 2),
        ))
        # Decrement stock: variant stock if variant, else product stock
        if ci.variant:
            ci.variant.stock_quantity -= ci.quantity
        else:
            product.stock_quantity -= ci.quantity
        db.delete(ci)

    if voucher:
        record_usage(db, voucher, user_id, order.id)

    db.commit()
    db.refresh(order)
    return order


def get_user_orders(db: Session, user_id: str) -> list[Order]:
    return (
        db.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )


def get_order(db: Session, order_id: str, user_id: str | None = None) -> Order | None:
    order = db.get(Order, order_id)
    if order is None:
        return None
    # Non-admin users can only view their own orders
    if user_id and order.user_id != user_id:
        return None
    return order


def get_all_orders(db: Session, status: str | None = None) -> list[Order]:
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()


def update_order_status(db: Session, order: Order, status: str) -> Order:
    valid_statuses = {"pending", "confirmed", "shipping", "delivered", "cancelled"}
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    # Restore stock when cancelling (guard against double-restore)
    if status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            if item.variant_id:
                variant = db.get(ProductVariant, item.variant_id)
                if variant:
                    variant.stock_quantity += item.quantity
            else:
                item.product.stock_quantity += item.quantity

    order.status = status
    db.commit()
    db.refresh(order)
    return order


def notify_payment(db: Session, order_id: str, user_id: str) -> Order:
    """User self-reports they have transferred money. Only valid for bank_transfer + unpaid."""
    order = db.get(Order, order_id)
    if not order:
        raise ValueError("Order not found")
    if order.user_id != user_id:
        raise ValueError("Forbidden")
    if order.payment_method != "bank_transfer":
        raise ValueError("Not a bank transfer order")
    if order.payment_status != "unpaid":
        raise ValueError("Payment already processed")
    order.payment_status = "pending_verification"
    db.commit()
    db.refresh(order)
    return order


def update_payment_status(db: Session, order: Order, status: str) -> Order:
    """Admin updates payment status."""
    valid = {"unpaid", "pending_verification", "paid", "refunded"}
    if status not in valid:
        raise ValueError(f"Invalid payment status. Must be one of: {', '.join(valid)}")
    order.payment_status = status
    db.commit()
    db.refresh(order)
    return order


def get_all_orders_filtered(
    db: Session,
    status: str | None = None,
    payment_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict:
    import math
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    query = query.order_by(Order.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total else 0,
    }


def get_revenue_stats(db: Session) -> list[dict]:
    """Daily revenue for the last 30 days."""
    rows = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("orders"),
            func.sum(Order.total_amount).label("revenue"),
        )
        .filter(Order.status != "cancelled")
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at).desc())
        .limit(30)
        .all()
    )
    return [{"date": str(r.date), "orders": r.orders, "revenue": float(r.revenue or 0)} for r in rows]


def get_top_products(db: Session, limit: int = 10) -> list[dict]:
    """Top products by quantity sold."""
    rows = (
        db.query(
            OrderItem.product_id,
            Product.name,
            func.sum(OrderItem.quantity).label("sold"),
            func.sum(OrderItem.subtotal).label("revenue"),
        )
        .join(Product, OrderItem.product_id == Product.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.status != "cancelled")
        .group_by(OrderItem.product_id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        {"product_id": r.product_id, "name": r.name, "sold": int(r.sold), "revenue": float(r.revenue or 0)}
        for r in rows
    ]
