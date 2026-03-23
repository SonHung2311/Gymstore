from typing import Generator

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _decode_token(token: str) -> str:
    """Decode JWT and return user id. Raises 401 on failure."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT from Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth scheme")
    token = authorization[7:]
    user_id = _decode_token(token)
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_optional_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """Return current user if token present, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        user_id = _decode_token(token)
        return db.get(User, user_id)
    except HTTPException:
        return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
