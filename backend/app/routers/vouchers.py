from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.voucher import VoucherValidateRequest, VoucherValidateResponse
from app.services.voucher import _get_active_voucher, _compute_discount
from app.models.cart import CartItem

router = APIRouter(prefix="/api/vouchers", tags=["vouchers"])


@router.post("/validate", response_model=VoucherValidateResponse)
def validate_voucher_endpoint(
    body: VoucherValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview discount amount for a voucher code against the user's current cart."""
    try:
        from app.services.voucher import validate_voucher

        cart_items = (
            db.query(CartItem)
            .filter(CartItem.user_id == current_user.id)
            .all()
        )
        if not cart_items:
            return VoucherValidateResponse(valid=False, discount_amount=0.0, message="Giỏ hàng trống")

        voucher, discount = validate_voucher(db, body.code, current_user.id, cart_items)

        label = (
            f"Giảm {float(voucher.discount_value):.0f}%"
            if voucher.discount_type == "percent"
            else f"Giảm {float(voucher.discount_value):,.0f}₫"
        )
        return VoucherValidateResponse(
            valid=True,
            discount_amount=discount,
            message=f"{label}: -{discount:,.0f}₫",
        )
    except ValueError as e:
        return VoucherValidateResponse(valid=False, discount_amount=0.0, message=str(e))
