import math

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.product import ProductReview
from app.schemas.product import (
    CategoryResponse,
    ProductListResponse,
    ProductResponse,
    ReviewCreate,
    ReviewResponse,
)
from app.services.product import get_categories, get_product_by_slug, list_products

router = APIRouter(prefix="/api/products", tags=["products"])


def _product_with_stats(product, db: Session) -> dict:
    """Attach avg_rating and review_count to a product object for serialization."""
    reviews = product.reviews  # already loaded or lazy-loaded
    count = len(reviews)
    avg = round(sum(r.rating for r in reviews) / count, 1) if count else None
    data = ProductResponse.model_validate(product).model_dump()
    data["avg_rating"] = avg
    data["review_count"] = count
    return data


@router.get("/categories", response_model=list[CategoryResponse])
def categories(db: Session = Depends(get_db)):
    return get_categories(db)


@router.get("", response_model=ProductListResponse)
def list_all(
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = list_products(db, search, category_id, min_price, max_price, page, limit)
    return {
        "items": [_product_with_stats(p, db) for p in items],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total else 0,
    }


@router.get("/{slug}", response_model=ProductResponse)
def product_detail(slug: str, db: Session = Depends(get_db)):
    product = get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_with_stats(product, db)


# ── Reviews ──────────────────────────────────────────────────────────────────

@router.get("/{slug}/reviews", response_model=list[ReviewResponse])
def list_reviews(slug: str, db: Session = Depends(get_db)):
    product = get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.reviews


@router.post("/{slug}/reviews", response_model=ReviewResponse)
def submit_review(
    slug: str,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Upsert: one review per user per product
    existing = (
        db.query(ProductReview)
        .filter_by(product_id=product.id, user_id=current_user.id)
        .first()
    )
    if existing:
        existing.rating = body.rating
        existing.comment = body.comment
        db.commit()
        db.refresh(existing)
        return existing

    review = ProductReview(
        product_id=product.id,
        user_id=current_user.id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{slug}/reviews/{review_id}", status_code=204)
def delete_review(
    slug: str,
    review_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    review = db.get(ProductReview, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(review)
    db.commit()
    return Response(status_code=204)
