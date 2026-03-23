from sqlalchemy.orm import Session

from app.models.cart import CartItem
from app.models.product import Product, ProductVariant


def _item_price(item: CartItem) -> float:
    """Return the effective price for a cart item (variant price if set, else product price)."""
    if item.variant and item.variant.price is not None:
        return float(item.variant.price)
    return float(item.product.price)


def _build_cart_response(items: list[CartItem]) -> dict:
    """Build cart summary dict from a list of CartItem ORM objects."""
    total = sum(_item_price(item) * item.quantity for item in items)
    return {"items": items, "total": round(total, 2), "item_count": sum(i.quantity for i in items)}


def get_cart(db: Session, user_id: str | None, session_id: str | None) -> dict:
    if user_id:
        items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    else:
        items = db.query(CartItem).filter(CartItem.session_id == session_id).all()
    return _build_cart_response(items)


def add_to_cart(
    db: Session,
    product_id: str,
    quantity: int,
    user_id: str | None,
    session_id: str | None,
    variant_id: str | None = None,
) -> CartItem:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise ValueError("Product not found")

    # Validate variant if provided
    variant = None
    if variant_id:
        variant = db.get(ProductVariant, variant_id)
        if not variant or variant.product_id != product_id or not variant.is_active:
            raise ValueError("Variant not found or unavailable")
        if variant.stock_quantity < quantity:
            raise ValueError(f"Insufficient stock for this variant")
    else:
        # If product has active variants, require one to be selected
        if any(v.is_active for v in product.variants):
            raise ValueError("Please select a variant for this product")
        if product.stock_quantity < quantity:
            raise ValueError("Insufficient stock")

    # Find existing cart item for same (product, variant) combo
    if user_id:
        base_q = db.query(CartItem).filter(CartItem.user_id == user_id, CartItem.product_id == product_id)
    else:
        base_q = db.query(CartItem).filter(CartItem.session_id == session_id, CartItem.product_id == product_id)

    existing = base_q.filter(
        CartItem.variant_id == variant_id if variant_id else CartItem.variant_id.is_(None)
    ).first()

    if existing:
        existing.quantity += quantity
        db.commit()
        db.refresh(existing)
        return existing

    item = CartItem(
        user_id=user_id, session_id=session_id,
        product_id=product_id, variant_id=variant_id, quantity=quantity
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_cart_item(db: Session, item_id: int, quantity: int, owner_id: str | None, session_id: str | None) -> CartItem:
    item = db.get(CartItem, item_id)
    if item is None:
        raise ValueError("Cart item not found")

    # Verify ownership
    if owner_id and item.user_id != owner_id:
        raise ValueError("Forbidden")
    if not owner_id and item.session_id != session_id:
        raise ValueError("Forbidden")

    if quantity <= 0:
        db.delete(item)
        db.commit()
        raise ValueError("Item removed")

    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return item


def remove_cart_item(db: Session, item_id: int, owner_id: str | None, session_id: str | None) -> None:
    item = db.get(CartItem, item_id)
    if item is None:
        raise ValueError("Cart item not found")
    if owner_id and item.user_id != owner_id:
        raise ValueError("Forbidden")
    if not owner_id and item.session_id != session_id:
        raise ValueError("Forbidden")
    db.delete(item)
    db.commit()


def merge_guest_cart(db: Session, session_id: str, user_id: str) -> None:
    """Merge guest cart into authenticated user cart. Guest items are moved/summed."""
    guest_items = db.query(CartItem).filter(CartItem.session_id == session_id).all()
    if not guest_items:
        return

    # Batch-load existing user items for these products (avoids N+1)
    guest_product_ids = [gi.product_id for gi in guest_items]
    existing_map = {
        item.product_id: item
        for item in db.query(CartItem)
        .filter(CartItem.user_id == user_id, CartItem.product_id.in_(guest_product_ids))
        .all()
    }

    for guest_item in guest_items:
        existing = existing_map.get(guest_item.product_id)
        if existing:
            existing.quantity += guest_item.quantity
            db.delete(guest_item)
        else:
            guest_item.user_id = user_id
            guest_item.session_id = None
    db.commit()
