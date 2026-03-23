import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm",
    "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac",
}
MAX_SIZE_IMAGE = 10 * 1024 * 1024   # 10 MB
MAX_SIZE_VIDEO = 100 * 1024 * 1024  # 100 MB
MAX_SIZE_AUDIO = 20 * 1024 * 1024   # 20 MB

EXT_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
    "audio/aac": ".aac",
}


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

    ext = EXT_MAP[content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / filename).write_bytes(data)

    return JSONResponse({"url": f"/uploads/{filename}", "type": media_type})
