from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.schemas.tag import TagCreate, TagResponse, TagUpdate
from app.services.tag import create_tag, delete_tag, get_tag, list_tags, update_tag

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """Public: list all active tags (for post creation, sidebar filter)."""
    return list_tags(db, active_only=True)


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin", response_model=list[TagResponse])
def admin_list_tags(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Admin: list ALL tags (including inactive)."""
    return list_tags(db, active_only=False)


@router.post("", response_model=TagResponse, status_code=201)
def admin_create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return create_tag(db, data)


@router.patch("/{tag_id}", response_model=TagResponse)
def admin_update_tag(
    tag_id: int,
    data: TagUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    tag = get_tag(db, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return update_tag(db, tag, data)


@router.delete("/{tag_id}", status_code=204)
def admin_delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    tag = get_tag(db, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    delete_tag(db, tag)
