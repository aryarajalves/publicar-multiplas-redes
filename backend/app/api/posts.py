import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Post, PlatformPublication, PostStatus, PlatformType, PublicationStatus
from app.schemas import PostRead, PostListResponse, ActionResponse, YouTubeVideoOptionRead
from app.utils.media import save_upload_video, remove_video_file, save_upload_image
from app.worker.tasks import execute_publication_pipeline

router = APIRouter(prefix="/posts", tags=["Posts"])
logger = logging.getLogger("api.posts")

def parse_platforms(platforms_raw: Optional[str]) -> List[str]:
    if not platforms_raw:
        return [PlatformType.INSTAGRAM.value]
    try:
        parsed = json.loads(platforms_raw)
        if isinstance(parsed, list):
            return [p.strip().lower() for p in parsed if p.strip()]
    except Exception:
        pass
    # Tenta separar por vírgula
    return [p.strip().lower() for p in platforms_raw.split(",") if p.strip()]

@router.post("/", response_model=PostRead, status_code=201)
async def create_and_schedule_post(
    title: str = Form(..., min_length=1, max_length=255),
    caption: Optional[str] = Form(None),
    scheduled_at: datetime = Form(...),
    platforms: Optional[str] = Form("instagram"),
    publish_now: bool = Form(False),
    video: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None),
    youtube_thumbnail: Optional[UploadFile] = File(None),
    thumbnail_path: Optional[str] = Form(None),
    youtube_thumbnail_path: Optional[str] = Form(None),
    transcription: Optional[str] = Form(None),
    instagram_caption: Optional[str] = Form(None),
    instagram_hashtags: Optional[str] = Form(None),
    youtube_title: Optional[str] = Form(None),
    youtube_description: Optional[str] = Form(None),
    youtube_tags: Optional[str] = Form(None),
    youtube_video_type: Optional[str] = Form("shorts"),
    youtube_related_video: Optional[str] = Form(None),
    tiktok_caption: Optional[str] = Form(None),
    tiktok_hashtags: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Cadastra um novo vídeo e agenda (ou publica imediatamente) para o Instagram,
    além de habilitar cross-posting para YouTube e TikTok.
    Suporta upload de capa vertical (Reels/Shorts/TikTok) e horizontal (YouTube 16:9).
    """
    platform_list = parse_platforms(platforms)
    valid_platforms = {p.value for p in PlatformType}
    invalid = [p for p in platform_list if p not in valid_platforms]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Plataformas inválidas: {invalid}. Válidas: {list(valid_platforms)}"
        )

    if youtube_tags and len(youtube_tags) > 500:
        raise HTTPException(
            status_code=400,
            detail="As tags do YouTube não podem ultrapassar 500 caracteres."
        )

    if youtube_related_video and len(youtube_related_video) > 500:
        raise HTTPException(
            status_code=400,
            detail="O link do vídeo final/relacionado do YouTube não pode ultrapassar 500 caracteres."
        )

    # Garante que pelo menos o Instagram esteja presente ou uma plataforma válida
    if not platform_list:
        platform_list = [PlatformType.INSTAGRAM.value]

    # Salva o arquivo de vídeo
    video_path, video_filename, size_bytes = await save_upload_video(video)

    # Salva thumbnails enviadas (vertical e YouTube longo)
    final_thumbnail_path = thumbnail_path
    if thumbnail and thumbnail.filename:
        saved_thumb_path, _ = await save_upload_image(thumbnail, prefix="thumb_vertical")
        final_thumbnail_path = saved_thumb_path

    final_youtube_thumbnail_path = youtube_thumbnail_path
    if youtube_thumbnail and youtube_thumbnail.filename:
        saved_yt_thumb_path, _ = await save_upload_image(youtube_thumbnail, prefix="thumb_youtube_long")
        final_youtube_thumbnail_path = saved_yt_thumb_path

    # Determina o status inicial
    initial_status = PostStatus.SCHEDULED.value
    if publish_now:
        initial_status = PostStatus.PUBLISHING.value

    # Garante que scheduled_at tenha timezone ou converte
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    new_post = Post(
        title=title,
        caption=caption,
        video_filename=video_filename,
        video_path=video_path,
        thumbnail_path=final_thumbnail_path,
        youtube_thumbnail_path=final_youtube_thumbnail_path,
        file_size_bytes=size_bytes,
        status=initial_status,
        scheduled_at=scheduled_at,
        transcription=transcription,
        instagram_caption=instagram_caption,
        instagram_hashtags=instagram_hashtags,
        youtube_title=youtube_title,
        youtube_description=youtube_description,
        youtube_tags=youtube_tags,
        youtube_video_type=youtube_video_type,
        youtube_related_video=youtube_related_video,
        tiktok_caption=tiktok_caption,
        tiktok_hashtags=tiktok_hashtags
    )
    db.add(new_post)
    db.flush()

    # Cria as publicações para cada plataforma selecionada
    for plat in platform_list:
        pub = PlatformPublication(
            post_id=new_post.id,
            platform=plat,
            status=PublicationStatus.PENDING.value
        )
        db.add(pub)

    db.commit()
    db.refresh(new_post)

    # Se a opção 'publish_now' foi marcada, executa o pipeline imediatamente
    if publish_now:
        await execute_publication_pipeline(new_post.id, db)
        db.refresh(new_post)

    return new_post

@router.get("/", response_model=PostListResponse)
def list_posts(
    status: Optional[str] = Query(None, description="Filtra por status geral do post"),
    platform: Optional[str] = Query(None, description="Filtra por plataforma alvo"),
    search: Optional[str] = Query(None, description="Busca no título ou legenda"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista todos os vídeos/posts cadastrados com suporte a filtros por status,
    plataforma e termo de busca.
    """
    query = db.query(Post)

    if status:
        query = query.filter(Post.status == status.lower())

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Post.title.ilike(search_pattern)) | (Post.caption.ilike(search_pattern))
        )

    if platform:
        query = query.join(Post.publications).filter(
            PlatformPublication.platform == platform.lower()
        )

    total = query.distinct().count()
    items = query.order_by(desc(Post.created_at)).offset(skip).limit(limit).all()

    return PostListResponse(total=total, items=items)

@router.get("/youtube-options", response_model=List[YouTubeVideoOptionRead])
async def get_youtube_video_options(db: Session = Depends(get_db)):
    """
    Retorna os vídeos longos do canal do YouTube em tempo real e do banco
    para preenchimento prático da Tela Final / Vídeo Relacionado.
    """
    options = []
    seen_ids = set()

    # 1. Busca em tempo real os vídeos longos do canal do YouTube do criador
    try:
        from app.publishers.youtube import YouTubePublisher
        yt_pub_service = YouTubePublisher()
        channel_videos = await yt_pub_service.list_channel_long_videos(max_results=50)
        for idx, cv in enumerate(channel_videos):
            y_id = cv.get("youtube_id")
            if y_id:
                seen_ids.add(y_id)
            pub_dt = cv.get("published_at")
            options.append(YouTubeVideoOptionRead(
                post_id=-(idx + 1),
                title=cv.get("title") or "Vídeo do Canal",
                youtube_id=y_id,
                url=cv.get("url") or f"https://www.youtube.com/watch?v={y_id}",
                type="video",
                status="published",
                thumbnail=cv.get("thumbnail"),
                created_at=pub_dt,
                published_at=pub_dt,
                duration_formatted=cv.get("duration_formatted")
            ))
    except Exception as e_ch:
        logger.warning(f"Não foi possível listar vídeos diretamente do canal do YouTube: {e_ch}")

    # 2. Mescla com vídeos cadastrados/publicados pelo sistema no banco de dados (excluindo shorts)
    posts = (
        db.query(Post)
        .join(PlatformPublication, Post.id == PlatformPublication.post_id)
        .filter(PlatformPublication.platform == PlatformType.YOUTUBE.value)
        .order_by(desc(Post.created_at))
        .all()
    )

    for p in posts:
        # Excluir estritamente publicações do tipo Shorts
        if (p.youtube_video_type or "").strip().lower() in ["shorts", "curto", "video curto"]:
            continue

        yt_pub = next((pub for pub in p.publications if pub.platform == PlatformType.YOUTUBE.value), None)
        if not yt_pub:
            continue

        yt_id = yt_pub.external_post_id
        if yt_id and yt_id in seen_ids:
            continue
        if yt_id:
            seen_ids.add(yt_id)

        yt_url = yt_pub.post_url or (f"https://www.youtube.com/watch?v={yt_id}" if yt_id else f"https://www.youtube.com/watch?v=post_{p.id}")

        options.append(YouTubeVideoOptionRead(
            post_id=p.id,
            title=p.youtube_title or p.title,
            youtube_id=yt_id,
            url=yt_url,
            type="video",
            status=yt_pub.status,
            thumbnail=p.youtube_thumbnail_path or p.thumbnail_path,
            created_at=p.created_at,
            published_at=p.created_at,
            duration_formatted=None
        ))

    # Ordena rigorosamente do último vídeo publicado (mais recente) no topo para os mais antigos
    from datetime import datetime, timezone

    def to_utc_dt(dt: Optional[datetime]) -> datetime:
        if dt is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    options.sort(
        key=lambda opt: to_utc_dt(opt.published_at or opt.created_at),
        reverse=True
    )
    return options

@router.get("/{post_id}", response_model=PostRead)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes completos de uma publicação pelo ID."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")
    return post

@router.put("/{post_id}", response_model=PostRead)
def update_post_details(
    post_id: int,
    title: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    scheduled_at: Optional[datetime] = Form(None),
    youtube_related_video: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Atualiza dados do post agendado (título, legenda, data, vídeo relacionado)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    if post.status == PostStatus.PUBLISHED.value:
        raise HTTPException(status_code=400, detail="Não é possível editar uma publicação que já foi publicada.")

    if title:
        post.title = title
    if caption is not None:
        post.caption = caption
    if youtube_related_video is not None:
        if len(youtube_related_video) > 500:
            raise HTTPException(status_code=400, detail="O link do vídeo final/relacionado do YouTube não pode ultrapassar 500 caracteres.")
        post.youtube_related_video = youtube_related_video
    if scheduled_at:
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        post.scheduled_at = scheduled_at
        if post.status == PostStatus.FAILED.value:
            post.status = PostStatus.SCHEDULED.value

    db.commit()
    db.refresh(post)
    return post

@router.delete("/{post_id}", response_model=ActionResponse)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Exclui uma publicação e remove o arquivo de vídeo do disco."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    video_path = post.video_path
    db.delete(post)
    db.commit()

    remove_video_file(video_path)
    return ActionResponse(success=True, message="Publicação excluída com sucesso.")

@router.post("/{post_id}/publish-now", response_model=PostRead)
async def publish_post_now(post_id: int, db: Session = Depends(get_db)):
    """Executa a publicação imediata de um post cadastrado."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    await execute_publication_pipeline(post_id, db)
    db.refresh(post)
    return post

@router.post("/{post_id}/cancel", response_model=PostRead)
def cancel_post(post_id: int, db: Session = Depends(get_db)):
    """Cancela o agendamento de uma publicação."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    if post.status == PostStatus.PUBLISHED.value:
        raise HTTPException(status_code=400, detail="Não é possível cancelar uma publicação já postada.")

    post.status = PostStatus.CANCELLED.value
    for pub in post.publications:
        if pub.status == PublicationStatus.PENDING.value:
            pub.status = PublicationStatus.SKIPPED.value

    db.commit()
    db.refresh(post)
    return post
