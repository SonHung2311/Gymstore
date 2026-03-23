from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services.banner import list_banners
from app.services.community import get_trending_posts
from app.services.product import list_products

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("")
def home_data(db: Session = Depends(get_db)):
    """
    Aggregated endpoint — returns banners, top products and trending posts
    in a single request to minimise client round-trips.
    """
    banners = list_banners(db, active_only=True)
    top_products, _ = list_products(db, page=1, limit=8, active_only=True)
    trending_posts = get_trending_posts(db, limit=5)

    return {
        "banners": [
            {"id": b.id, "title": b.title, "subtitle": b.subtitle, "cta": b.cta, "link": b.link, "bg": b.bg}
            for b in banners
        ],
        "top_products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "price": float(p.price),
                "images": p.images,
                "category": {"id": p.category.id, "name": p.category.name} if p.category else None,
            }
            for p in top_products
        ],
        "trending_posts": [
            {
                "id": p.id,
                "title": p.title,
                "tags": p.tags,
                "like_count": p.like_count,
                "comment_count": p.comment_count,
                "author": {
                    "id": p.author.id,
                    "full_name": p.author.full_name,
                    "avatar": p.author.avatar,
                },
                "created_at": p.created_at.isoformat(),
            }
            for p in trending_posts
        ],
    }
