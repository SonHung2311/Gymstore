from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class VoucherCreate(BaseModel):
    code: str
    description: str | None = None
    discount_type: Literal["percent", "fixed"]
    discount_value: float
    min_order_amount: float | None = None
    max_discount_amount: float | None = None
    applies_to: Literal["all", "category", "product"] = "all"
    category_id: int | None = None
    product_id: str | None = None
    usage_limit: int | None = None
    per_user_limit: int = 1
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    is_active: bool = True

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        return v.strip().upper()


class VoucherUpdate(BaseModel):
    description: str | None = None
    discount_type: Literal["percent", "fixed"] | None = None
    discount_value: float | None = None
    min_order_amount: float | None = None
    max_discount_amount: float | None = None
    applies_to: Literal["all", "category", "product"] | None = None
    category_id: int | None = None
    product_id: str | None = None
    usage_limit: int | None = None
    per_user_limit: int | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    is_active: bool | None = None


class VoucherResponse(BaseModel):
    id: int
    code: str
    description: str | None
    discount_type: str
    discount_value: float
    min_order_amount: float | None
    max_discount_amount: float | None
    applies_to: str
    category_id: int | None
    product_id: str | None
    usage_limit: int | None
    usage_count: int
    per_user_limit: int
    valid_from: datetime | None
    valid_until: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VoucherValidateRequest(BaseModel):
    code: str


class VoucherValidateResponse(BaseModel):
    valid: bool
    discount_amount: float
    message: str
