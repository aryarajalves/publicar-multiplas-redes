import io
import pytest
from fastapi import UploadFile, HTTPException
from app.utils.media import (
    is_allowed_video_file,
    save_upload_video,
    remove_video_file,
    is_allowed_image_file,
    save_upload_image,
)

def test_is_allowed_video_file():
    assert is_allowed_video_file("video.mp4") is True
    assert is_allowed_video_file("reel.mov") is True
    assert is_allowed_video_file("clip.avi") is True
    assert is_allowed_video_file("document.pdf") is False
    assert is_allowed_video_file("virus.exe") is False
    assert is_allowed_video_file("image.png") is False

def test_is_allowed_image_file():
    assert is_allowed_image_file("capa.png") is True
    assert is_allowed_image_file("thumb.jpg") is True
    assert is_allowed_image_file("banner.jpeg") is True
    assert is_allowed_image_file("cover.webp") is True
    assert is_allowed_image_file("video.mp4") is False
    assert is_allowed_image_file("doc.pdf") is False

@pytest.mark.asyncio
async def test_save_upload_video_success():
    content = b"fake video bytes stream"
    file = UploadFile(filename="meu_video.mp4", file=io.BytesIO(content))
    
    path, filename, size = await save_upload_video(file)
    assert filename.startswith("video_")
    assert filename.endswith(".mp4")
    assert size == len(content)
    
    # Testa remoção
    removed = remove_video_file(f"test_uploads/{filename}")
    assert removed is True

@pytest.mark.asyncio
async def test_save_upload_video_invalid_format():
    file = UploadFile(filename="foto.jpg", file=io.BytesIO(b"fake image"))
    with pytest.raises(HTTPException) as exc_info:
        await save_upload_video(file)
    assert exc_info.value.status_code == 400
    assert "Formato de arquivo não suportado" in exc_info.value.detail

@pytest.mark.asyncio
async def test_save_upload_image_success():
    content = b"fake image byte data"
    file = UploadFile(filename="minha_thumb.png", file=io.BytesIO(content))
    
    path, filename = await save_upload_image(file, prefix="thumb_test")
    assert filename.startswith("thumb_test_")
    assert filename.endswith(".png")
    assert path.startswith("uploads/thumbnails/")
    remove_video_file(f"test_uploads/thumbnails/{filename}")

@pytest.mark.asyncio
async def test_save_upload_image_invalid_format():
    file = UploadFile(filename="video.mp4", file=io.BytesIO(b"fake image"))
    with pytest.raises(HTTPException) as exc_info:
        await save_upload_image(file)
    assert exc_info.value.status_code == 400
    assert "Formato de imagem não suportado" in exc_info.value.detail
