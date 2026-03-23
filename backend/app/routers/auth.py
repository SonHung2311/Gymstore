from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    create_access_token,
    create_user,
    generate_reset_token,
    get_user_by_email,
    reset_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(db, body.email, body.password, body.full_name, body.phone)
    return {"access_token": create_access_token(user.id)}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    return {"access_token": create_access_token(user.id)}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if user:
        token = generate_reset_token(db, user)
        # In production: send email with token. Here we return it for dev convenience.
        return {"message": "Reset token generated", "reset_token": token}
    # Always return 200 to avoid email enumeration
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def do_reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    success = reset_password(db, body.token, body.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users/search")
def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=10, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search active users by name or email (for new conversation picker)."""
    pattern = f"%{q}%"
    users = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            User.id != current_user.id,
            (User.full_name.ilike(pattern) | User.email.ilike(pattern)),
        )
        .limit(limit)
        .all()
    )
    return [{"id": u.id, "full_name": u.full_name, "avatar": u.avatar} for u in users]
