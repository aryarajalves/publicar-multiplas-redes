import os
import json
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.config import settings
from app.utils.media import save_upload_video
from app.services.ai_service import transcribe_video_file, generate_social_content, generate_thumbnail
from app.schemas import AIGenerationResponse, ThumbnailGenerateResponse

router = APIRouter(prefix="/ai", tags=["AI & Transcription"])

def parse_platforms(platforms_raw: Optional[str]) -> List[str]:
    if not platforms_raw:
        return ["instagram", "youtube", "tiktok"]
    try:
        parsed = json.loads(platforms_raw)
        if isinstance(parsed, list):
            return [p.strip().lower() for p in parsed if p.strip()]
    except Exception:
        pass
    return [p.strip().lower() for p in platforms_raw.split(",") if p.strip()]

@router.post("/transcribe-and-generate", response_model=AIGenerationResponse)
async def transcribe_and_generate_content(
    video: Optional[UploadFile] = File(None),
    video_path: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    platforms: Optional[str] = Form("instagram,youtube,tiktok"),
    duration_seconds: Optional[float] = Form(None),
    youtube_instructions: Optional[str] = Form(None),
    base_text: Optional[str] = Form(None)
):
    """
    Transcreve o áudio do vídeo com OpenAI Whisper e gera conteúdo personalizado
    para cada rede social (Instagram, YouTube e TikTok), aceitando opcionalmente texto base/roteiro de referência.
    """
    target_path = None
    target_filename = None

    if video and video.filename:
        # Salva o arquivo de upload para processamento
        saved_rel_path, unique_name, _ = await save_upload_video(video)
        target_path = str(Path(settings.UPLOAD_DIR) / unique_name)
        target_filename = unique_name
    elif video_path:
        # Se um caminho já foi passado
        clean_path = video_path.replace("uploads/", "").replace("uploads\\", "")
        full_path = Path(settings.UPLOAD_DIR) / clean_path
        if full_path.exists():
            target_path = str(full_path)
            target_filename = full_path.name
        else:
            target_path = video_path
            target_filename = Path(video_path).name

    if not target_path:
        raise HTTPException(
            status_code=400,
            detail="É necessário fornecer um arquivo de vídeo ou o caminho de um vídeo já carregado."
        )

    # 1. Transcreve com OpenAI Whisper (guiado por base_text se presente)
    transcription = await transcribe_video_file(target_path, filename=target_filename, base_text=base_text)

    # 2. Gera conteúdos sociais com OpenAI GPT
    platform_list = parse_platforms(platforms)
    title_hint = title or (Path(target_filename).stem if target_filename else "")
    
    generated = await generate_social_content(
        transcription=transcription,
        platforms=platform_list,
        title_hint=title_hint,
        duration_seconds=duration_seconds,
        youtube_instructions=youtube_instructions,
        base_text=base_text
    )

    return generated

@router.post("/generate-from-transcription", response_model=AIGenerationResponse)
async def generate_from_existing_transcription(
    transcription: str = Form(...),
    title: Optional[str] = Form(None),
    platforms: Optional[str] = Form("instagram,youtube,tiktok"),
    duration_seconds: Optional[float] = Form(None),
    youtube_instructions: Optional[str] = Form(None),
    base_text: Optional[str] = Form(None)
):
    """
    Gera conteúdo personalizado diretamente a partir de um texto de transcrição já existente e texto base.
    """
    platform_list = parse_platforms(platforms)
    title_hint = title or ""

    generated = await generate_social_content(
        transcription=transcription,
        platforms=platform_list,
        title_hint=title_hint,
        duration_seconds=duration_seconds,
        youtube_instructions=youtube_instructions,
        base_text=base_text
    )

    return generated

@router.post("/generate-thumbnail", response_model=ThumbnailGenerateResponse)
async def generate_thumbnail_endpoint(
    title: str = Form(...),
    transcription: Optional[str] = Form(None),
    format_type: str = Form("reels"),
    prompt_hint: Optional[str] = Form(None),
    reference_images: Optional[List[UploadFile]] = File(None),
    reference_text: Optional[str] = Form(None)
):
    """
    Gera uma thumbnail com IA (OpenAI DALL-E 3) adaptada para Reels/Shorts (9:16) ou Vídeos Longos do YouTube (16:9).
    Suporta imagens de referência (analisadas via Vision) e texto de referência do usuário.
    """
    if not title.strip() and not (transcription and transcription.strip()):
        raise HTTPException(
            status_code=400,
            detail="Informe um título ou transcrição para gerar a thumbnail."
        )

    # Salva eventuais imagens de referência enviadas
    reference_image_paths = []
    if reference_images:
        ref_dir = Path(settings.UPLOAD_DIR) / "references"
        ref_dir.mkdir(parents=True, exist_ok=True)
        import uuid
        for img in reference_images:
            if img.filename:
                ext = Path(img.filename).suffix or ".jpg"
                clean_name = f"ref_{uuid.uuid4().hex[:10]}{ext}"
                dest = ref_dir / clean_name
                content = await img.read()
                if content:
                    with open(dest, "wb") as f:
                        f.write(content)
                    reference_image_paths.append(str(dest))

    result = await generate_thumbnail(
        title=title,
        transcription=transcription,
        format_type=format_type,
        prompt_hint=prompt_hint,
        reference_image_paths=reference_image_paths if reference_image_paths else None,
        reference_text=reference_text
    )
    return result
