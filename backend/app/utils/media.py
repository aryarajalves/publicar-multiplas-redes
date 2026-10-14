import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

def is_allowed_video_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in settings.ALLOWED_EXTENSIONS

def is_allowed_image_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS

async def save_upload_image(file: UploadFile, prefix: str = "thumb") -> tuple[str, str]:
    """
    Saves an uploaded image file (thumbnail) to the UPLOAD_DIR/thumbnails.
    Returns: (saved_relative_path, unique_filename)
    """
    if not file or not file.filename:
        return "", ""
    if not is_allowed_image_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Formato de imagem não suportado ({Path(file.filename).suffix}). Formatos permitidos: .png, .jpg, .jpeg, .webp"
        )
    upload_dir = Path(settings.UPLOAD_DIR) / "thumbnails"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix.lower()
    unique_filename = f"{prefix}_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = upload_dir / unique_filename

    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    relative_path = f"uploads/thumbnails/{unique_filename}"
    return relative_path, unique_filename

async def save_upload_video(file: UploadFile) -> tuple[str, str, int]:
    """
    Saves an uploaded video file to the UPLOAD_DIR.
    Returns: (saved_relative_path, unique_filename, file_size_bytes)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido.")
    
    if not is_allowed_video_file(file.filename):
        allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=400, 
            detail=f"Formato de arquivo não suportado ({Path(file.filename).suffix}). Formatos permitidos: {allowed}"
        )
    
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    ext = Path(file.filename).suffix.lower()
    unique_filename = f"video_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = upload_dir / unique_filename
    
    size_bytes = 0
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            size_bytes += len(chunk)
            if size_bytes > (settings.MAX_FILE_SIZE_MB * 1024 * 1024):
                if dest_path.exists():
                    os.remove(dest_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"Arquivo excede o tamanho máximo de {settings.MAX_FILE_SIZE_MB}MB."
                )
            buffer.write(chunk)
            
    relative_path = f"uploads/{unique_filename}"
    return relative_path, unique_filename, size_bytes

def remove_video_file(file_path: str) -> bool:
    try:
        p = Path(file_path)
        if p.exists():
            p.unlink()
            return True
    except Exception:
        pass
    return False
