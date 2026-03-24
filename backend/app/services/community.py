import math

from sqlalchemy import cast, desc, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, joinedload

from app.models.community import Comment, Like, Post
from app.schemas.community import PostCreate, PostUpdate


def list_posts(
    db: Session,
    tag: str | None = None,
    sort: str = "new",       # "new" | "hot"
    page: int = 1,
    limit: int = 10,
    viewer_id: str | None = None,
    search: str | None = None,
    user_id: str | None = None,
) -> dict:
    query = db.query(Post).options(joinedload(Post.author))
    if tag:
        # Cast JSON → JSONB for @> containment operator on PostgreSQL
        query = query.filter(cast(Post.tags, JSONB).contains([tag]))
    if search:
        query = query.filter(Post.title.ilike(f"%{search}%"))
    if user_id:
        query = query.filter(Post.user_id == user_id)

    if sort == "hot":
        query = query.order_by(desc(Post.like_count), desc(Post.created_at))
    else:
        query = query.order_by(desc(Post.created_at))

    total = query.count()
    posts = query.offset((page - 1) * limit).limit(limit).all()

    # Resolve which posts the current viewer has liked (single query)
    liked_ids: set[str] = set()
    if viewer_id and posts:
        post_ids = [p.id for p in posts]
        rows = (
            db.query(Like.post_id)
            .filter(Like.user_id == viewer_id, Like.post_id.in_(post_ids))
            .all()
        )
        liked_ids = {r.post_id for r in rows}

    return {
        "items": posts,
        "liked_ids": liked_ids,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total else 0,
    }


def get_post(db: Session, post_id: str) -> Post | None:
    return db.get(Post, post_id)


def create_post(db: Session, user_id: str, data: PostCreate) -> Post:
    post = Post(
        user_id=user_id,
        title=data.title,
        content=data.content,
        image_url=data.image_url,
        tags=data.tags,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, post: Post, data: PostUpdate) -> Post:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post: Post) -> None:
    db.delete(post)
    db.commit()


def toggle_like(db: Session, post_id: str, user_id: str) -> bool:
    """Toggle like on a post. Returns True if liked, False if unliked."""
    existing = db.get(Like, {"user_id": user_id, "post_id": post_id})
    post = db.get(Post, post_id)
    if not post:
        raise ValueError("Post not found")

    if existing:
        db.delete(existing)
        post.like_count = max(0, post.like_count - 1)
        db.commit()
        return False
    else:
        db.add(Like(user_id=user_id, post_id=post_id))
        post.like_count += 1
        db.commit()
        return True


def list_comments(db: Session, post_id: str) -> list[Comment]:
    return (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at)
        .all()
    )


def add_comment(db: Session, post_id: str, user_id: str, content: str) -> Comment:
    post = db.get(Post, post_id)
    if not post:
        raise ValueError("Post not found")
    comment = Comment(post_id=post_id, user_id=user_id, content=content)
    db.add(comment)
    post.comment_count += 1
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment: Comment) -> None:
    post = db.get(Post, comment.post_id)
    if post:
        post.comment_count = max(0, post.comment_count - 1)
    db.delete(comment)
    db.commit()


def get_trending_posts(db: Session, limit: int = 5) -> list[Post]:
    """Top posts by like_count for home page section."""
    return (
        db.query(Post)
        .options(joinedload(Post.author))
        .order_by(desc(Post.like_count), desc(Post.created_at))
        .limit(limit)
        .all()
    )
