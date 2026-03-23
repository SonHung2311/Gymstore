import math
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.auth import AdminUserUpdate


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str | None,
    phone: str | None,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def generate_reset_token(db: Session, user: User) -> str:
    """Generate a secure random reset token, store its hash on the user, return plain token."""
    plain_token = secrets.token_urlsafe(32)
    user.reset_token = hash_password(plain_token)
    db.commit()
    return plain_token


def list_users(
    db: Session,
    search: str | None = None,
    role: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[User], int]:
    query = db.query(User)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.email.ilike(like)) | (User.full_name.ilike(like))
        )
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return users, total


def update_user_admin(db: Session, user: User, data: AdminUserUpdate) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, token: str, new_password: str) -> bool:
    """Find user with matching reset token, update password. Return False if not found."""
    # Scan all users that have a reset_token set (small set in practice)
    users = db.query(User).filter(User.reset_token.isnot(None)).all()
    for user in users:
        if verify_password(token, user.reset_token):
            user.password_hash = hash_password(new_password)
            user.reset_token = None
            db.commit()
            return True
    return False
