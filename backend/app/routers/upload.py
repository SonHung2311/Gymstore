import asyncio
import io

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/upload", tags=["upload"])

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm",
    "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac",
}
MAX_SIZE_IMAGE = 10 * 1024 * 1024   # 10 MB
MAX_SIZE_VIDEO = 100 * 1024 * 1024  # 100 MB
MAX_SIZE_AUDIO = 20 * 1024 * 1024   # 20 MB


@router.post("")
async def upload_media(
    file: UploadFile,
    _: User = Depends(get_current_user),
):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Chỉ chấp nhận ảnh (JPEG/PNG/GIF/WebP), video (MP4/WebM) hoặc âm thanh (MP3/OGG/WAV/AAC)",
        )

    is_video = content_type.startswith("video/")
    is_audio = content_type.startswith("audio/")
    if is_video:
        max_size = MAX_SIZE_VIDEO
        media_type = "video"
    elif is_audio:
        max_size = MAX_SIZE_AUDIO
        media_type = "audio"
    else:
        max_size = MAX_SIZE_IMAGE
        media_type = "image"

    data = await file.read()
    if len(data) > max_size:
        limit_mb = max_size // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File quá lớn. Giới hạn: {limit_mb} MB",
        )

    result = await asyncio.to_thread(
        cloudinary.uploader.upload,
        io.BytesIO(data),
        resource_type="auto",
        folder="gymstore",
    )
    url = result["secure_url"]

    return JSONResponse({"url": url, "type": media_type})
