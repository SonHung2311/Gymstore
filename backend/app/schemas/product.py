from datetime import datetime

from pydantic import BaseModel, field_validator


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str


class AttributeTypeResponse(BaseModel):
    id: int
    name: str
    values: list[str]
    display_order: int
    model_config = {"from_attributes": True}


class AttributeTypeCreate(BaseModel):
    name: str
    values: list[str]
    display_order: int = 0


class AttributeTypeUpdate(BaseModel):
    name: str | None = None
    values: list[str] | None = None
    display_order: int | None = None


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock_quantity: int = 0
    images: list[str] = []
    category_id: int | None = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock_quantity: int | None = None
    images: list[str] | None = None
    category_id: int | None = None
    is_active: bool | None = None


class ProductAttributeResponse(BaseModel):
    id: int
    name: str
    values: list[str]
    display_order: int
    model_config = {"from_attributes": True}


class ProductAttributeWrite(BaseModel):
    name: str
    values: list[str]
    display_order: int = 0


class ProductVariantResponse(BaseModel):
    id: str
    sku: str | None
    attributes: dict
    price: float | None
    stock_quantity: int
    is_active: bool
    model_config = {"from_attributes": True}


class ProductVariantWrite(BaseModel):
    sku: str | None = None
    attributes: dict
    price: float | None = None
    stock_quantity: int = 0
    is_active: bool = True


class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    price: float
    stock_quantity: int
    images: list[str]
    is_active: bool
    category: CategoryResponse | None
    created_at: datetime
    avg_rating: float | None = None
    review_count: int = 0
    attributes: list[ProductAttributeResponse] = []
    variants: list[ProductVariantResponse] = []

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int


class ReviewAuthor(BaseModel):
    id: str
    full_name: str | None
    avatar: str | None
    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewResponse(BaseModel):
    id: str
    rating: int
    comment: str | None
    author: ReviewAuthor
    created_at: datetime
    model_config = {"from_attributes": True}
