import logging
import asyncio
from typing import Optional, List
from pathlib import Path
import httpx
from app.config import settings
from app.database import SessionLocal
from app.models import Post, PlatformPublication, PublicationSetting
from app.publishers.base import BasePublisher, PublicationResult

logger = logging.getLogger("publishers.youtube")

def parse_youtube_duration_to_seconds(duration_str: str) -> int:
    """Converte formato ISO 8601 (ex: PT6M11S, PT1H2M10S, PT45S) em segundos."""
    if not duration_str:
        return 0
    import re
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

def format_seconds_to_duration(seconds: int) -> str:
    """Formata segundos em MM:SS ou HH:MM:SS."""
    if not seconds:
        return "0:00"
    m = seconds // 60
    s = seconds % 60
    h = m // 60
    m = m % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

async def check_is_short(client: httpx.AsyncClient, vid_id: str, sec: int) -> bool:
    """
    Verifica com precisão se um vídeo é um Short.
    Vídeos com duração <= 60s são sempre Shorts.
    Vídeos com duração > 185s (3 min) nunca são Shorts (limite oficial do YouTube).
    Para vídeos entre 61s e 185s, verifica se o endpoint /shorts/{id} redireciona para /watch (vídeo longo) ou responde 200 (Short).
    """
    if sec <= 60:
        return True
    if sec > 185:
        return False
    try:
        r = await client.head(
            f"https://www.youtube.com/shorts/{vid_id}",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=5.0
        )
        if r.status_code in (301, 302, 303, 307, 308):
            return False
        if r.status_code == 200:
            return True
    except Exception:
        pass
    return False

class YouTubePublisher(BasePublisher):
    platform_name = "youtube"

    def is_configured(self) -> bool:
        return bool(
            (settings.YOUTUBE_CLIENT_ID and settings.YOUTUBE_CLIENT_SECRET and settings.YOUTUBE_REFRESH_TOKEN)
            or settings.YOUTUBE_API_KEY
        )

    async def get_access_token(self) -> Optional[str]:
        """
        Renova automaticamente o access token do YouTube usando o Refresh Token,
        garantindo que a automação nunca pare por expiração de sessão.
        """
        if not (settings.YOUTUBE_CLIENT_ID and settings.YOUTUBE_CLIENT_SECRET and settings.YOUTUBE_REFRESH_TOKEN):
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": settings.YOUTUBE_CLIENT_ID,
                        "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                        "refresh_token": settings.YOUTUBE_REFRESH_TOKEN,
                        "grant_type": "refresh_token"
                    }
                )
                if res.status_code == 200:
                    token_data = res.json()
                    return token_data.get("access_token")
                logger.error(f"[YouTube] Falha ao renovar token OAuth: {res.text}")
        except Exception as e:
            logger.error(f"[YouTube] Erro ao obter access token: {e}", exc_info=True)
        return None

    async def list_channel_long_videos(self, max_results: int = 50) -> List[dict]:
        """
        Busca em tempo real os vídeos longos do canal do YouTube do criador
        para preenchimento do dropdown de tela final.
        """
        token = await self.get_access_token()
        if not token:
            logger.warning("[YouTube] Não foi possível obter access token para listar vídeos do canal.")
            return []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                ch_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "contentDetails", "mine": "true"},
                    headers={"Authorization": f"Bearer {token}"}
                )
                if ch_res.status_code != 200:
                    logger.warning(f"[YouTube] Falha ao obter playlist do canal ({ch_res.status_code}): {ch_res.text}")
                    return []

                ch_data = ch_res.json()
                items = ch_data.get("items", [])
                if not items:
                    return []

                uploads_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

                pl_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/playlistItems",
                    params={"part": "snippet,contentDetails", "playlistId": uploads_id, "maxResults": max_results},
                    headers={"Authorization": f"Bearer {token}"}
                )
                if pl_res.status_code != 200:
                    logger.warning(f"[YouTube] Falha ao obter vídeos da playlist ({pl_res.status_code}): {pl_res.text}")
                    return []

                pl_items = pl_res.json().get("items", [])
                video_ids = [it["contentDetails"]["videoId"] for it in pl_items if "contentDetails" in it and "videoId" in it["contentDetails"]]
                if not video_ids:
                    return []

                v_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={"part": "snippet,contentDetails", "id": ",".join(video_ids)},
                    headers={"Authorization": f"Bearer {token}"}
                )
                if v_res.status_code != 200:
                    logger.warning(f"[YouTube] Falha ao obter detalhes dos vídeos ({v_res.status_code}): {v_res.text}")
                    return []

                v_items = v_res.json().get("items", [])

                async def eval_item(v):
                    duration_str = v.get("contentDetails", {}).get("duration", "")
                    sec = parse_youtube_duration_to_seconds(duration_str)
                    vid_id = v.get("id")
                    if not vid_id:
                        return None
                    # Descarta se for Shorts
                    is_short = await check_is_short(client, vid_id, sec)
                    if is_short:
                        return None

                    snippets = v.get("snippet", {})
                    title = snippets.get("title", "")
                    thumbs = snippets.get("thumbnails", {})
                    thumb_url = (thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}).get("url")

                    published_at_str = snippets.get("publishedAt")
                    published_dt = None
                    if published_at_str:
                        try:
                            from datetime import datetime
                            published_dt = datetime.fromisoformat(published_at_str.replace("Z", "+00:00"))
                        except Exception:
                            pass

                    return {
                        "youtube_id": vid_id,
                        "title": title,
                        "url": f"https://www.youtube.com/watch?v={vid_id}",
                        "duration_seconds": sec,
                        "duration_formatted": format_seconds_to_duration(sec),
                        "thumbnail": thumb_url,
                        "type": "video",
                        "status": "published",
                        "published_at": published_dt
                    }

                eval_results = await asyncio.gather(*[eval_item(v) for v in v_items])
                long_videos = [r for r in eval_results if r is not None]

                # Ordena rigorosamente do último vídeo publicado (mais recente) no topo para os mais antigos
                from datetime import datetime, timezone
                def to_utc(dt):
                    if dt is None:
                        return datetime.min.replace(tzinfo=timezone.utc)
                    if dt.tzinfo is None:
                        return dt.replace(tzinfo=timezone.utc)
                    return dt

                long_videos.sort(
                    key=lambda x: to_utc(x.get("published_at")),
                    reverse=True
                )
                return long_videos
        except Exception as e:
            logger.error(f"[YouTube] Erro ao listar vídeos longos do canal: {e}", exc_info=True)
            return []

    async def publish(self, post: Post, publication: PlatformPublication) -> PublicationResult:
        is_shorts = (post.youtube_video_type or "shorts").strip().lower() in ["shorts", "curto", "video curto"]

        if settings.SIMULATE_PUBLICATIONS or not self.is_configured():
            await asyncio.sleep(1.0)
            mock_id = f"yt_{'short' if is_shorts else 'video'}_{post.id}_{int(asyncio.get_event_loop().time() * 1000)}"
            mock_url = f"https://www.youtube.com/shorts/{mock_id}" if is_shorts else f"https://www.youtube.com/watch?v={mock_id}"
            logger.info(f"[YouTube] [SIMULADO] Publicação ({'Shorts' if is_shorts else 'Vídeo Longo'}) concluída! URL: {mock_url}")
            return PublicationResult(
                success=True,
                external_post_id=mock_id,
                post_url=mock_url
            )

        # Publicação Real via YouTube Data API v3 com Token Renovado Automaticamente
        try:
            # Localiza o arquivo de vídeo no disco
            video_file = Path(post.video_path)
            if not video_file.exists():
                video_file = Path(settings.UPLOAD_DIR) / video_file.name

            if not video_file.exists():
                return PublicationResult(
                    success=False,
                    error_message=f"Arquivo de vídeo não encontrado no caminho: {post.video_path}"
                )

            file_size = video_file.stat().st_size

            access_token = await self.get_access_token()
            if not access_token:
                # Fallback para API Key se disponível
                access_token = settings.YOUTUBE_API_KEY

            if not access_token:
                return PublicationResult(
                    success=False,
                    error_message="Credenciais do YouTube incompletas: impossível gerar token de acesso."
                )

            async with httpx.AsyncClient(timeout=300.0) as client:
                yt_title = (post.youtube_title or post.title)[:100]
                base_desc = post.youtube_description or post.caption or ""
                if getattr(post, "youtube_related_video", None):
                    related_link = post.youtube_related_video.strip()
                    if related_link:
                        if not related_link.startswith("http://") and not related_link.startswith("https://"):
                            related_link = f"https://www.youtube.com/watch?v={related_link}"
                        base_desc = f"{base_desc}\n\n🎬 Vídeo Recomendado no Final: {related_link}".strip()

                yt_desc = f"{base_desc}\n\n#shorts" if is_shorts and "#shorts" not in base_desc.lower() else base_desc
                if post.youtube_tags:
                    raw_tags = [t.strip() for t in post.youtube_tags.split(",") if t.strip()]
                    yt_tags = []
                    total_chars = 0
                    for tag in raw_tags:
                        if total_chars + len(tag) <= 500:
                            yt_tags.append(tag)
                            total_chars += len(tag)
                        else:
                            break
                else:
                    yt_tags = ["shorts", "reels", "video"] if is_shorts else ["video", "youtube", "conteudo"]

                parts = ["snippet", "status"]
                payload = {
                    "snippet": {
                        "title": yt_title,
                        "description": yt_desc,
                        "tags": yt_tags,
                        "categoryId": "22"
                    },
                    "status": {
                        "privacyStatus": "public",
                        "selfDeclaredMadeForKids": False
                    }
                }

                # Anexa localização padrão se configurada
                try:
                    with SessionLocal() as db:
                        pub_setting = db.query(PublicationSetting).first()
                        if pub_setting and pub_setting.apply_location_to_all and (pub_setting.youtube_location_name or pub_setting.default_location_name):
                            loc_name = (pub_setting.youtube_location_name or pub_setting.default_location_name).strip()
                            if loc_name:
                                payload["recordingDetails"] = {
                                    "locationDescription": loc_name
                                }
                                parts.append("recordingDetails")
                                logger.info(f"[YouTube] Localização padrão configurada: '{loc_name}'")
                except Exception as e:
                    logger.warning(f"[YouTube] Não foi possível carregar publication_settings para localização: {e}")

                # 1. Inicia sessão de Upload Resumable do YouTube
                init_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Upload-Content-Type": "video/mp4",
                    "X-Upload-Content-Length": str(file_size)
                }

                part_param = ",".join(parts)
                init_url = f"https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part={part_param}"
                init_res = await client.post(init_url, headers=init_headers, json=payload)

                if init_res.status_code != 200:
                    return PublicationResult(
                        success=False,
                        error_message=f"Erro ao iniciar upload no YouTube ({init_res.status_code}): {init_res.text}"
                    )

                upload_url = init_res.headers.get("Location")
                if not upload_url:
                    return PublicationResult(
                        success=False,
                        error_message="YouTube não retornou a URL de upload resumable."
                    )

                # 2. Transmite os bytes do vídeo
                with open(video_file, "rb") as vf:
                    video_bytes = vf.read()

                upload_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "video/mp4",
                    "Content-Length": str(file_size)
                }

                upload_res = await client.put(upload_url, headers=upload_headers, content=video_bytes)

                if upload_res.status_code in (200, 201):
                    yt_id = upload_res.json().get("id")
                    logger.info(f"[YouTube] Upload concluído com sucesso! Video ID: {yt_id}")

                    # 3. Se houver thumbnail enviada (preferência para youtube_thumbnail_path ou thumbnail_path)
                    chosen_thumb = getattr(post, 'youtube_thumbnail_path', None) or post.thumbnail_path
                    if yt_id and chosen_thumb:
                        thumb_file = Path(chosen_thumb)
                        if not thumb_file.exists():
                            thumb_file = Path(settings.UPLOAD_DIR) / thumb_file.name
                        if thumb_file.exists():
                            try:
                                with open(thumb_file, "rb") as tf:
                                    thumb_bytes = tf.read()
                                thumb_url = f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={yt_id}"
                                content_type = "image/jpeg" if thumb_file.suffix.lower() in [".jpg", ".jpeg"] else "image/png"
                                thumb_headers = {
                                    "Authorization": f"Bearer {access_token}",
                                    "Content-Type": content_type
                                }
                                await client.post(thumb_url, headers=thumb_headers, content=thumb_bytes)
                                logger.info(f"[YouTube] Thumbnail customizada enviada com sucesso para o vídeo {yt_id}!")
                            except Exception as e_thumb:
                                logger.warning(f"[YouTube] Não foi possível enviar thumbnail customizada: {e_thumb}")

                    return PublicationResult(
                        success=True,
                        external_post_id=yt_id,
                        post_url=f"https://www.youtube.com/shorts/{yt_id}" if is_shorts else f"https://www.youtube.com/watch?v={yt_id}"
                    )
                else:
                    return PublicationResult(
                        success=False,
                        error_message=f"Erro ao enviar arquivo para o YouTube ({upload_res.status_code}): {upload_res.text}"
                    )
        except Exception as e:
            logger.error(f"[YouTube] Exceção durante cross-posting: {e}", exc_info=True)
            return PublicationResult(success=False, error_message=str(e))
