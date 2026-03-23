from pydantic import BaseModel

from app.schemas.product import ProductResponse, ProductVariantResponse


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1
    variant_id: str | None = None


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    product: ProductResponse
    variant_id: str | None = None
    variant: ProductVariantResponse | None = None
    quantity: int

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total: float
    item_count: int


class MergeCartRequest(BaseModel):
    session_id: str
