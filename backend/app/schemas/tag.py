from datetime import datetime

from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    color: str = "bg-gray-100 text-gray-700"
    is_active: bool = True


class TagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    is_active: bool | None = None


class TagResponse(BaseModel):
    id: int
    name: str
    color: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
