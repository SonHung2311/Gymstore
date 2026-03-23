from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderResponse
from app.services.order import checkout, get_order, get_user_orders, notify_payment

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        order = checkout(db, current_user.id, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order


@router.get("", response_model=list[OrderResponse])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_orders(db, current_user.id)


@router.get("/{order_id}", response_model=OrderResponse)
def order_detail(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = get_order(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/payment/notify", response_model=OrderResponse)
def payment_notify(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User self-reports they have completed a bank transfer."""
    try:
        return notify_payment(db, order_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
