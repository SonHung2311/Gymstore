import math
import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.product import Category
from app.models.user import User
from app.schemas.auth import AdminUserListResponse, AdminUserResponse, AdminUserUpdate
from app.schemas.community import UserProfileUpdate
from app.schemas.banner import BannerCreate, BannerResponse, BannerUpdate
from app.schemas.community import PostListResponse, PostResponse
from app.schemas.order import OrderPaymentUpdate, OrderResponse, OrderStatusUpdate
from app.models.product import AttributeType as AttributeTypeModel
from app.models.product import ProductAttribute as ProductAttributeModel
from app.models.product import ProductVariant as ProductVariantModel
from app.schemas.product import (
    AttributeTypeCreate,
    AttributeTypeResponse,
    AttributeTypeUpdate,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ProductAttributeResponse,
    ProductAttributeWrite,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    ProductVariantResponse,
    ProductVariantWrite,
)
from app.models.voucher import Voucher as VoucherModel
from app.schemas.voucher import VoucherCreate, VoucherResponse, VoucherUpdate
from app.services.auth import list_users, update_user_admin
from app.services.banner import (
    create_banner,
    delete_banner,
    get_banner,
    list_banners,
    update_banner,
)
from app.routers.community import _serialize_post
from app.services.community import delete_post, get_post, list_posts
from app.services.order import (
    get_all_orders_filtered,
    get_order,
    get_revenue_stats,
    get_top_products,
    update_order_status,
    update_payment_status,
)
from app.services.product import (
    create_product,
    delete_product,
    get_product_by_id,
    list_products,
    update_product,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "category"


# ── Attribute Types ───────────────────────────────────────────────────────────

@router.get("/attribute-types", response_model=list[AttributeTypeResponse])
def admin_list_attribute_types(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(AttributeTypeModel).order_by(AttributeTypeModel.display_order, AttributeTypeModel.name).all()


@router.post("/attribute-types", response_model=AttributeTypeResponse, status_code=201)
def admin_create_attribute_type(
    body: AttributeTypeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attr = AttributeTypeModel(name=body.name.strip(), values=body.values, display_order=body.display_order)
    db.add(attr)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tên thuộc tính đã tồn tại")
    db.refresh(attr)
    return attr


@router.patch("/attribute-types/{attr_id}", response_model=AttributeTypeResponse)
def admin_update_attribute_type(
    attr_id: int,
    body: AttributeTypeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attr = db.get(AttributeTypeModel, attr_id)
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute type not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "name" and value is not None:
            value = value.strip()
        setattr(attr, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tên thuộc tính đã tồn tại")
    db.refresh(attr)
    return attr


@router.delete("/attribute-types/{attr_id}", status_code=204)
def admin_delete_attribute_type(
    attr_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attr = db.get(AttributeTypeModel, attr_id)
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute type not found")
    db.delete(attr)
    db.commit()


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryResponse])
def admin_list_categories(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(Category).order_by(Category.name).all()


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def admin_create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = Category(name=body.name.strip(), slug=_slugify(body.name))
    db.add(cat)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tên danh mục đã tồn tại")
    db.refresh(cat)
    return cat


@router.patch("/categories/{cat_id}", response_model=CategoryResponse)
def admin_update_category(
    cat_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = body.name.strip()
    cat.slug = _slugify(body.name)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tên danh mục đã tồn tại")
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", status_code=204)
def admin_delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()


# ── Products ─────────────────────────────────────────────────────────────────

@router.get("/products", response_model=ProductListResponse)
def admin_list_products(
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    items, total = list_products(db, search, category_id, page=page, limit=limit, active_only=False)
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total else 0,
    }


@router.post("/products", response_model=ProductResponse, status_code=201)
def admin_create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return create_product(db, body)


@router.put("/products/{product_id}", response_model=ProductResponse)
def admin_update_product(
    product_id: str,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return update_product(db, product, body)


@router.delete("/products/{product_id}", status_code=204)
def admin_delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    delete_product(db, product)


# ── Per-product Attributes ────────────────────────────────────────────────────

@router.get("/products/{product_id}/attributes", response_model=list[ProductAttributeResponse])
def admin_list_product_attributes(
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.attributes


@router.post("/products/{product_id}/attributes", response_model=ProductAttributeResponse, status_code=201)
def admin_create_product_attribute(
    product_id: str,
    body: ProductAttributeWrite,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    attr = ProductAttributeModel(product_id=product_id, name=body.name, values=body.values, display_order=body.display_order)
    db.add(attr)
    db.commit()
    db.refresh(attr)
    return attr


@router.put("/products/{product_id}/attributes/{attr_id}", response_model=ProductAttributeResponse)
def admin_update_product_attribute(
    product_id: str,
    attr_id: int,
    body: ProductAttributeWrite,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attr = db.get(ProductAttributeModel, attr_id)
    if not attr or attr.product_id != product_id:
        raise HTTPException(status_code=404, detail="Attribute not found")
    attr.name = body.name
    attr.values = body.values
    attr.display_order = body.display_order
    db.commit()
    db.refresh(attr)
    return attr


@router.delete("/products/{product_id}/attributes/{attr_id}", status_code=204)
def admin_delete_product_attribute(
    product_id: str,
    attr_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attr = db.get(ProductAttributeModel, attr_id)
    if not attr or attr.product_id != product_id:
        raise HTTPException(status_code=404, detail="Attribute not found")
    db.delete(attr)
    db.commit()


# ── Per-product Variants ──────────────────────────────────────────────────────

def _normalize_attrs(d: dict) -> str:
    """Stable string key for attribute combination comparison."""
    return str(sorted((str(k).strip().lower(), str(v).strip().lower()) for k, v in d.items()))


def _check_variant_uniqueness(db: Session, product_id: str, attributes: dict, exclude_variant_id: str | None = None) -> None:
    """Raise 400 if a variant with the same attribute combination already exists."""
    existing = db.query(ProductVariantModel).filter_by(product_id=product_id).all()
    new_key = _normalize_attrs(attributes)
    for ev in existing:
        if exclude_variant_id and ev.id == exclude_variant_id:
            continue
        if _normalize_attrs(ev.attributes or {}) == new_key:
            combo = ", ".join(f"{k}: {v}" for k, v in attributes.items())
            raise HTTPException(status_code=400, detail=f"Tổ hợp thuộc tính đã tồn tại: {combo}")


@router.get("/products/{product_id}/variants", response_model=list[ProductVariantResponse])
def admin_list_product_variants(
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.variants


@router.post("/products/{product_id}/variants", response_model=ProductVariantResponse, status_code=201)
def admin_create_product_variant(
    product_id: str,
    body: ProductVariantWrite,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    _check_variant_uniqueness(db, product_id, body.attributes)
    variant = ProductVariantModel(product_id=product_id, **body.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.put("/products/{product_id}/variants/{variant_id}", response_model=ProductVariantResponse)
def admin_update_product_variant(
    product_id: str,
    variant_id: str,
    body: ProductVariantWrite,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    variant = db.get(ProductVariantModel, variant_id)
    if not variant or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant not found")
    _check_variant_uniqueness(db, product_id, body.attributes, exclude_variant_id=variant_id)
    for field, value in body.model_dump().items():
        setattr(variant, field, value)
    db.commit()
    db.refresh(variant)
    return variant


@router.delete("/products/{product_id}/variants/{variant_id}", status_code=204)
def admin_delete_product_variant(
    product_id: str,
    variant_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    variant = db.get(ProductVariantModel, variant_id)
    if not variant or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.delete(variant)
    db.commit()


# ── Orders ───────────────────────────────────────────────────────────────────

@router.get("/orders", response_model=list[OrderResponse])
def admin_list_orders(
    status: str | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return get_all_orders_filtered(db, status, payment_status)


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
def admin_update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return update_order_status(db, order, body.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/orders/{order_id}/payment-status", response_model=OrderResponse)
def admin_update_payment_status(
    order_id: str,
    body: OrderPaymentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return update_payment_status(db, order, body.payment_status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=AdminUserListResponse)
def admin_list_users(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users, total = list_users(db, search, role, page, limit)
    return {
        "items": users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total else 0,
    }


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def admin_update_user(
    user_id: str,
    body: AdminUserUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Prevent admin from deactivating their own account
    if user.id == current_admin.id and body.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    return update_user_admin(db, user, body)


@router.patch("/users/{user_id}/profile", response_model=AdminUserResponse)
def admin_update_user_profile(
    user_id: str,
    body: UserProfileUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# ── Posts ──────────────────────────────────────────────────────────────────────

@router.get("/posts", response_model=PostListResponse)
def admin_list_posts(
    tag: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort: str = Query(default="new", pattern="^(new|hot)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = list_posts(db, tag=tag, sort=sort, page=page, limit=limit, search=search)
    result.pop("liked_ids")
    result["items"] = [_serialize_post(p) for p in result["items"]]
    return result


@router.delete("/posts/{post_id}", status_code=204)
def admin_delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    delete_post(db, post)


# ── Banners ───────────────────────────────────────────────────────────────────

@router.get("/banners", response_model=list[BannerResponse])
def admin_list_banners(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return list_banners(db, active_only=False)


@router.post("/banners", response_model=BannerResponse, status_code=201)
def admin_create_banner(
    body: BannerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return create_banner(db, body)


@router.put("/banners/{banner_id}", response_model=BannerResponse)
def admin_update_banner(
    banner_id: int,
    body: BannerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    banner = get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return update_banner(db, banner, body)


@router.delete("/banners/{banner_id}", status_code=204)
def admin_delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    banner = get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    delete_banner(db, banner)


# ── Vouchers ─────────────────────────────────────────────────────────────────

@router.get("/vouchers", response_model=list[VoucherResponse])
def admin_list_vouchers(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(VoucherModel).order_by(VoucherModel.created_at.desc()).all()


@router.post("/vouchers", response_model=VoucherResponse, status_code=201)
def admin_create_voucher(
    body: VoucherCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from sqlalchemy.exc import IntegrityError
    voucher = VoucherModel(**body.model_dump())
    db.add(voucher)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Mã giảm giá đã tồn tại")
    db.refresh(voucher)
    return voucher


@router.patch("/vouchers/{voucher_id}", response_model=VoucherResponse)
def admin_update_voucher(
    voucher_id: int,
    body: VoucherUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    voucher = db.get(VoucherModel, voucher_id)
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(voucher, field, value)
    db.commit()
    db.refresh(voucher)
    return voucher


@router.delete("/vouchers/{voucher_id}", status_code=204)
def admin_delete_voucher(
    voucher_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    voucher = db.get(VoucherModel, voucher_id)
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    db.delete(voucher)
    db.commit()


# ── Statistics ────────────────────────────────────────────────────────────────

@router.get("/stats/revenue")
def admin_revenue(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return get_revenue_stats(db)


@router.get("/stats/top-products")
def admin_top_products(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return get_top_products(db, limit)
