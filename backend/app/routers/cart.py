from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_optional_user
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse, MergeCartRequest
from app.services.cart import (
    add_to_cart,
    get_cart,
    merge_guest_cart,
    remove_cart_item,
    update_cart_item,
)

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _resolve_identity(
    current_user: User | None,
    x_session_id: str | None,
) -> tuple[str | None, str | None]:
    """Return (user_id, session_id). Exactly one will be set."""
    if current_user:
        return current_user.id, None
    if not x_session_id:
        raise HTTPException(status_code=400, detail="X-Session-Id header required for guest cart")
    return None, x_session_id


@router.get("", response_model=CartResponse)
def get_my_cart(
    x_session_id: str | None = Header(default=None),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id, session_id = _resolve_identity(current_user, x_session_id)
    return get_cart(db, user_id, session_id)


@router.post("/items", response_model=CartResponse, status_code=201)
def add_item(
    body: CartItemAdd,
    x_session_id: str | None = Header(default=None),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id, session_id = _resolve_identity(current_user, x_session_id)
    try:
        add_to_cart(db, body.product_id, body.quantity, user_id, session_id, body.variant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return get_cart(db, user_id, session_id)


@router.put("/items/{item_id}", response_model=CartResponse)
def update_item(
    item_id: int,
    body: CartItemUpdate,
    x_session_id: str | None = Header(default=None),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id, session_id = _resolve_identity(current_user, x_session_id)
    try:
        update_cart_item(db, item_id, body.quantity, user_id, session_id)
    except ValueError as e:
        if "removed" not in str(e).lower():
            raise HTTPException(status_code=400, detail=str(e))
    return get_cart(db, user_id, session_id)


@router.delete("/items/{item_id}", response_model=CartResponse)
def delete_item(
    item_id: int,
    x_session_id: str | None = Header(default=None),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id, session_id = _resolve_identity(current_user, x_session_id)
    try:
        remove_cart_item(db, item_id, user_id, session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return get_cart(db, user_id, session_id)


@router.post("/merge", response_model=CartResponse)
def merge(
    body: MergeCartRequest,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Merge guest cart into the authenticated user's cart. Call right after login."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    merge_guest_cart(db, body.session_id, current_user.id)
    return get_cart(db, current_user.id, None)
