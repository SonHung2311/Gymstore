from datetime import datetime

from pydantic import BaseModel, field_validator

VALID_TAGS = {"Workout", "Nutrition", "Q&A", "Transformation"}


class AuthorInfo(BaseModel):
    id: str
    full_name: str | None
    avatar: str | None

    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    title: str
    content: str
    image_url: str | None = None
    tags: list[str] = []

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        invalid = set(v) - VALID_TAGS
        if invalid:
            raise ValueError(f"Invalid tags: {invalid}. Must be one of {VALID_TAGS}")
        return v


class PostUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    image_url: str | None = None
    tags: list[str] | None = None


class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    image_url: str | None
    tags: list[str]
    like_count: int
    comment_count: int
    author: AuthorInfo
    liked_by_me: bool = False   # populated in service layer
    created_at: datetime

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    items: list[PostResponse]
    total: int
    page: int
    limit: int
    pages: int


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    content: str
    author: AuthorInfo
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar: str | None = None
    bio: str | None = None


class UserPublicProfile(BaseModel):
    id: str
    full_name: str | None
    avatar: str | None
    bio: str | None
    post_count: int
