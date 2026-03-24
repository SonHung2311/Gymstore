from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate


def list_tags(db: Session, active_only: bool = False) -> list[Tag]:
    query = db.query(Tag)
    if active_only:
        query = query.filter(Tag.is_active == True)  # noqa: E712
    return query.order_by(Tag.name).all()


def get_tag(db: Session, tag_id: int) -> Tag | None:
    return db.get(Tag, tag_id)


def create_tag(db: Session, data: TagCreate) -> Tag:
    tag = Tag(**data.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def update_tag(db: Session, tag: Tag, data: TagUpdate) -> Tag:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, tag: Tag) -> None:
    db.delete(tag)
    db.commit()
