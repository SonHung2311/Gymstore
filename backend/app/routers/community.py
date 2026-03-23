from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, get_optional_user
from app.models.community import Post
from app.models.user import User
from app.schemas.community import (
    CommentCreate,
    CommentResponse,
    PostCreate,
    PostListResponse,
    PostResponse,
    PostUpdate,
    UserProfileUpdate,
    UserPublicProfile,
)
from app.schemas.auth import UserResponse
from app.services.community import (
    add_comment,
    create_post,
    delete_comment,
    delete_post,
    get_post,
    list_comments,
    list_posts,
    toggle_like,
    update_post,
)

router = APIRouter(prefix="/api/community", tags=["community"])


def _serialize_post(post, liked_ids: set[str] | None = None) -> dict:
    """Build PostResponse-compatible dict, injecting liked_by_me flag."""
    d = {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "image_url": post.image_url,
        "tags": post.tags,
        "like_count": post.like_count,
        "comment_count": post.comment_count,
        "author": post.author,
        "liked_by_me": (post.id in liked_ids) if liked_ids is not None else False,
        "created_at": post.created_at,
    }
    return d


@router.get("/posts", response_model=PostListResponse)
def get_posts(
    tag: str | None = Query(default=None),
    sort: str = Query(default="new", pattern="^(new|hot)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    user_id: str | None = Query(default=None),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    result = list_posts(
        db, tag, sort, page, limit,
        viewer_id=current_user.id if current_user else None,
        user_id=user_id,
    )
    liked_ids: set[str] = result.pop("liked_ids")
    result["items"] = [_serialize_post(p, liked_ids) for p in result["items"]]
    return result


@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post_detail(
    post_id: str,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    liked_ids = {post_id} if current_user and any(l.user_id == current_user.id for l in post.likes) else set()
    return _serialize_post(post, liked_ids)


@router.post("/posts", response_model=PostResponse, status_code=201)
def create(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = create_post(db, current_user.id, body)
    return _serialize_post(post)


@router.put("/posts/{post_id}", response_model=PostResponse)
def update(
    post_id: str,
    body: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    post = update_post(db, post, body)
    return _serialize_post(post)


@router.delete("/posts/{post_id}", status_code=204)
def delete(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    delete_post(db, post)


@router.post("/posts/{post_id}/like")
def like(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        liked = toggle_like(db, post_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"liked": liked}


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(post_id: str, db: Session = Depends(get_db)):
    return list_comments(db, post_id)


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
def post_comment(
    post_id: str,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return add_comment(db, post_id, current_user.id, body.content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/comments/{comment_id}", status_code=204)
def remove_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.community import Comment as CommentModel
    comment = db.get(CommentModel, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    delete_comment(db, comment)


# ── User public profile ───────────────────────────────────────────────────────

@router.get("/users/{user_id}", response_model=UserPublicProfile)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    post_count = db.query(Post).filter(Post.user_id == user_id).count()
    return {
        "id": user.id,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "bio": user.bio,
        "post_count": post_count,
    }


# ── User profile ──────────────────────────────────────────────────────────────

@router.patch("/profile", response_model=UserResponse)
def update_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
