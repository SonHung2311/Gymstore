from datetime import datetime

from pydantic import BaseModel


class BannerCreate(BaseModel):
    title: str
    subtitle: str | None = None
    cta: str = "Xem ngay"
    link: str = "/store"
    bg: str = "from-primary to-secondary"
    is_active: bool = True
    order: int = 0
    display_page: str = "all"  # all | home | store | community


class BannerUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    cta: str | None = None
    link: str | None = None
    bg: str | None = None
    is_active: bool | None = None
    order: int | None = None
    display_page: str | None = None


class BannerResponse(BaseModel):
    id: int
    title: str
    subtitle: str | None
    cta: str
    link: str
    bg: str
    is_active: bool
    order: int
    display_page: str
    created_at: datetime

    model_config = {"from_attributes": True}
