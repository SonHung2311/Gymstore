import re

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Category, Product
from app.schemas.product import ProductCreate, ProductUpdate


def slugify(text: str) -> str:
    """Convert a string to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


def get_categories(db: Session) -> list[Category]:
    return db.query(Category).order_by(Category.name).all()


def list_products(
    db: Session,
    search: str | None = None,
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    page: int = 1,
    limit: int = 20,
    active_only: bool = True,
) -> tuple[list[Product], int]:
    """Return (products, total_count) with optional filtering."""
    query = db.query(Product)

    if active_only:
        query = query.filter(Product.is_active.is_(True))
    if search:
        pattern = f"%{search}%"
        query = query.filter(Product.name.ilike(pattern))
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    total = query.count()
    items = query.order_by(Product.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_product_by_slug(db: Session, slug: str) -> Product | None:
    return db.query(Product).filter(Product.slug == slug, Product.is_active.is_(True)).first()


def get_product_by_id(db: Session, product_id: str) -> Product | None:
    return db.get(Product, product_id)


def create_product(db: Session, data: ProductCreate) -> Product:
    base_slug = slugify(data.name)
    # Ensure slug is unique by appending a counter if needed
    slug = base_slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    product = Product(**data.model_dump(), slug=slug)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: ProductUpdate) -> Product:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()
