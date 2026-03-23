from sqlalchemy.orm import Session

from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate


def list_banners(db: Session, active_only: bool = False) -> list[Banner]:
    query = db.query(Banner)
    if active_only:
        query = query.filter(Banner.is_active == True)  # noqa: E712
    return query.order_by(Banner.order, Banner.id).all()


def get_banner(db: Session, banner_id: int) -> Banner | None:
    return db.get(Banner, banner_id)


def create_banner(db: Session, data: BannerCreate) -> Banner:
    banner = Banner(**data.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


def update_banner(db: Session, banner: Banner, data: BannerUpdate) -> Banner:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)
    db.commit()
    db.refresh(banner)
    return banner


def delete_banner(db: Session, banner: Banner) -> None:
    db.delete(banner)
    db.commit()
