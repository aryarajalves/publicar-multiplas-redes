import asyncio
import logging
import re
import time
import unicodedata
from typing import Optional, List, Dict, Any, Set
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
import httpx

from app.config import settings
from app.database import get_db
from app.models import InstagramFavoriteAudio
from app.schemas import (
    InstagramAudioItem,
    InstagramAudioSearchResponse,
    InstagramProfileResponse,
)

logger = logging.getLogger("api.instagram")
router = APIRouter(prefix="/instagram", tags=["Instagram Audio & Profile"])

MIN_FOLLOWERS_FOR_TRIAL_REELS = 1000
_PROFILE_CACHE: Dict[str, Any] = {"data": None, "timestamp": 0.0}
_PROFILE_CACHE_TTL_SECONDS = 60.0

# Cache em memória do catálogo da Meta (music + original_sound) para carregamento instantâneo
_CATALOG_CACHE: Dict[str, Dict[str, Any]] = {
    "music": {"items": [], "timestamp": 0.0, "next_cursor": None},
    "original_sound": {"items": [], "timestamp": 0.0, "next_cursor": None},
}
_CATALOG_CACHE_TTL_SECONDS = 300.0

# Cache em memória para prévias de áudio resolvidas (evita chamadas repetidas)
_AUDIO_PREVIEW_CACHE: Dict[str, Dict[str, Optional[str]]] = {}

FALLBACK_AUDIO_TRACKS: List[Dict[str, Any]] = [
    {
        "audio_id": "1120932070383283",
        "title": "Blue Moon",
        "display_artist": "Zara Larsson",
        "duration_in_ms": 177544,
        "audio_type": "music",
        "cover_artwork_thumbnail_uri": None,
        "download_url": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c3/d0/2d/c3d02d85-ff66-852c-2b5a-3d0a0cc5cf37/mzaf_12516535957166586320.plus.aac.p.m4a",
        "on_platform_audio_preview_link": "https://www.instagram.com/reels/audio/1120932070383283/",
        "is_ads_eligible": False,
    },
    {
        "audio_id": "592271352837708",
        "title": "Beautiful",
        "display_artist": "Giulio Cercato",
        "duration_in_ms": 152054,
        "audio_type": "music",
        "cover_artwork_thumbnail_uri": None,
        "download_url": None,
        "on_platform_audio_preview_link": "https://www.instagram.com/reels/audio/592271352837708/",
        "is_ads_eligible": True,
    },
    {
        "audio_id": "1494225382610752",
        "title": "Trending Reel Beat",
        "display_artist": "Meta Sound Collection",
        "duration_in_ms": 50760,
        "audio_type": "music",
        "cover_artwork_thumbnail_uri": None,
        "download_url": None,
        "on_platform_audio_preview_link": "https://www.instagram.com/reels/audio/1494225382610752/",
        "is_ads_eligible": True,
    },
]


def clear_instagram_profile_cache():
    _PROFILE_CACHE["data"] = None
    _PROFILE_CACHE["timestamp"] = 0.0


def _normalize_text(val: Optional[str]) -> str:
    if not val:
        return ""
    nfkd = unicodedata.normalize("NFKD", val)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


async def _resolve_external_audio_preview(
    client: httpx.AsyncClient,
    audio_id: str,
    title: str,
    artist: str,
) -> Dict[str, Optional[str]]:
    """
    Quando a Meta Graph API retorna download_url=null para músicas comerciais,
    busca automaticamente o stream de prévia (30s AAC/MP3) e a capa via iTunes/Deezer.
    """
    cache_key = f"{audio_id}:{title}:{artist}".lower()
    if cache_key in _AUDIO_PREVIEW_CACHE:
        return _AUDIO_PREVIEW_CACHE[cache_key]

    clean_artist = (artist or "").split(",")[0].strip()
    if clean_artist.lower() in ("artista", "meta sound collection", "instagram"):
        clean_artist = ""
    search_term = f"{title} {clean_artist}".strip()

    result: Dict[str, Optional[str]] = {"preview_url": None, "artwork_url": None}
    if not search_term:
        return result

    try:
        itunes_resp = await client.get(
            "https://itunes.apple.com/search",
            params={"term": search_term, "media": "music", "entity": "song", "limit": 1, "country": "BR"},
            timeout=3.5,
        )
        if itunes_resp.status_code == 200:
            results = itunes_resp.json().get("results") or []
            if results:
                first = results[0]
                result["preview_url"] = first.get("previewUrl")
                result["artwork_url"] = first.get("artworkUrl100")
    except Exception as e:
        logger.debug(f"[Instagram Audio Preview] Falha no fallback iTunes para '{search_term}': {e}")

    if not result["preview_url"]:
        try:
            deezer_resp = await client.get(
                "https://api.deezer.com/search",
                params={"q": search_term, "limit": 1},
                timeout=3.5,
            )
            if deezer_resp.status_code == 200:
                data = deezer_resp.json().get("data") or []
                if data:
                    first = data[0]
                    result["preview_url"] = first.get("preview")
                    album = first.get("album") or {}
                    result["artwork_url"] = album.get("cover_medium") or album.get("cover")
        except Exception as e:
            logger.debug(f"[Instagram Audio Preview] Falha no fallback Deezer para '{search_term}': {e}")

    _AUDIO_PREVIEW_CACHE[cache_key] = result
    return result


async def _enrich_tracks_with_previews(items: List[InstagramAudioItem], max_enrich: int = 12) -> None:
    """
    Preenche em paralelo o download_url e cover_artwork_thumbnail_uri das primeiras faixas
    sem URL direta, mantendo o carregamento da lista de 80-100 músicas super rápido.
    """
    missing = [item for item in items if not item.download_url][:max_enrich]
    if not missing:
        return

    sem = asyncio.Semaphore(8)

    async with httpx.AsyncClient(timeout=4.0) as client:
        async def _enrich_one(item: InstagramAudioItem):
            async with sem:
                resolved = await _resolve_external_audio_preview(
                    client,
                    item.audio_id,
                    item.title,
                    item.display_artist or "",
                )
                if resolved.get("preview_url"):
                    item.download_url = resolved["preview_url"]
                if not item.cover_artwork_thumbnail_uri and resolved.get("artwork_url"):
                    item.cover_artwork_thumbnail_uri = resolved["artwork_url"]

        await asyncio.gather(*(_enrich_one(i) for i in missing), return_exceptions=True)


async def _fetch_meta_catalog_category(
    audio_type: str,
    account_id: str,
    access_token: str,
    after_cursor: Optional[str] = None,
) -> tuple[List[InstagramAudioItem], Optional[str]]:
    """
    Busca até 100 faixas de uma categoria ('music' ou 'original_sound') na Meta Graph API v22.0,
    usando cache de 5 minutos quando não há cursor de paginação.
    """
    now = time.time()
    cache_entry = _CATALOG_CACHE.get(audio_type)
    if (
        not after_cursor
        and cache_entry
        and cache_entry["items"]
        and (now - cache_entry["timestamp"]) < _CATALOG_CACHE_TTL_SECONDS
    ):
        cloned = [item.model_copy() for item in cache_entry["items"]]
        return cloned, cache_entry.get("next_cursor")

    params: Dict[str, Any] = {
        "audio_type": audio_type,
        "user_id": account_id,
        "access_token": access_token,
        "limit": 100,
    }
    if after_cursor:
        params["after"] = after_cursor

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://graph.facebook.com/v22.0/ig_audio",
            params=params,
        )

    if resp.status_code != 200:
        err_msg = resp.json().get("error", {}).get("message", resp.text)
        logger.warning(f"[Instagram Audio] Resposta {resp.status_code} em /ig_audio ({audio_type}): {err_msg}")
        return [], None

    payload = resp.json()
    raw_audio = payload.get("audio") or payload.get("data") or []
    paging = payload.get("paging") or {}
    next_cursor = (paging.get("cursors") or {}).get("after") if paging.get("next") else None

    items: List[InstagramAudioItem] = []
    for track in raw_audio:
        audio_id = str(track.get("audio_id") or track.get("id") or "").strip()
        if not audio_id:
            continue
        items.append(
            InstagramAudioItem(
                audio_id=audio_id,
                title=track.get("title") or "Áudio do Instagram",
                display_artist=track.get("display_artist") or track.get("ig_username") or "Artista",
                duration_in_ms=int(track.get("duration_in_ms") or 0),
                audio_type=str(track.get("audio_type") or audio_type),
                cover_artwork_thumbnail_uri=track.get("cover_artwork_thumbnail_uri")
                or track.get("cover_artwork_thumbnail_url"),
                download_url=track.get("download_url"),
                on_platform_audio_preview_link=track.get("on_platform_audio_preview_link")
                or f"https://www.instagram.com/reels/audio/{audio_id}/",
                is_ads_eligible=track.get("is_ads_eligible"),
                ig_username=track.get("ig_username"),
            )
        )

    if not after_cursor and items:
        _CATALOG_CACHE[audio_type] = {
            "items": [item.model_copy() for item in items],
            "timestamp": now,
            "next_cursor": next_cursor,
        }

    return items, next_cursor


def _get_favorite_ids(db: Session) -> Set[str]:
    rows = db.query(InstagramFavoriteAudio.audio_id).all()
    return {r[0] for r in rows}


def _extract_audio_id_from_query(query_str: str) -> Optional[str]:
    """
    Permite ao usuário colar um link do Instagram Reels Audio
    (ex: https://www.instagram.com/reels/audio/1541481904658530/) ou ID numérico.
    """
    match = re.search(r"instagram\.com/reels/audio/(\d+)", query_str)
    if match:
        return match.group(1)
    if re.fullmatch(r"\d{8,25}", query_str.strip()):
        return query_str.strip()
    return None


@router.get("/profile", response_model=InstagramProfileResponse)
async def get_instagram_profile(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache de 60s")
):
    """
    Consulta em tempo real os dados da conta do Instagram conectada (@username,
    quantidade atual de seguidores e elegibilidade para Reels de Teste >= 1.000 seguidores).
    """
    account_id = (settings.INSTAGRAM_ACCOUNT_ID or "").strip()
    access_token = (settings.INSTAGRAM_ACCESS_TOKEN or "").strip()

    if not account_id or not access_token:
        return InstagramProfileResponse(
            connected=False,
            account_id=None,
            username=None,
            account_name=None,
            name=None,
            followers_count=0,
            media_count=0,
            profile_picture_url=None,
            trial_reels_eligible=False,
            min_followers_for_trial=MIN_FOLLOWERS_FOR_TRIAL_REELS,
        )

    now = time.time()
    if (
        not force_refresh
        and _PROFILE_CACHE["data"] is not None
        and (now - _PROFILE_CACHE["timestamp"]) < _PROFILE_CACHE_TTL_SECONDS
    ):
        return _PROFILE_CACHE["data"]

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                f"https://graph.facebook.com/v22.0/{account_id}",
                params={
                    "fields": "id,username,name,followers_count,media_count,profile_picture_url",
                    "access_token": access_token,
                },
            )

        if resp.status_code == 200:
            data = resp.json()
            username = data.get("username") or "instagram"
            followers_count = int(data.get("followers_count") or 0)
            media_count = int(data.get("media_count") or 0)
            profile = InstagramProfileResponse(
                connected=True,
                account_id=str(data.get("id") or account_id),
                username=username,
                account_name=f"@{username.lstrip('@')}",
                name=data.get("name") or username,
                followers_count=followers_count,
                media_count=media_count,
                profile_picture_url=data.get("profile_picture_url"),
                trial_reels_eligible=followers_count >= MIN_FOLLOWERS_FOR_TRIAL_REELS,
                min_followers_for_trial=MIN_FOLLOWERS_FOR_TRIAL_REELS,
            )
            _PROFILE_CACHE["data"] = profile
            _PROFILE_CACHE["timestamp"] = now
            return profile
    except Exception as e:
        logger.error(f"[Instagram Profile] Exceção ao consultar perfil do Instagram: {e}", exc_info=True)

    return InstagramProfileResponse(
        connected=True,
        account_id=account_id,
        username="instagram",
        account_name="@instagram",
        name="Instagram Reels",
        followers_count=0,
        media_count=0,
        profile_picture_url=None,
        trial_reels_eligible=False,
        min_followers_for_trial=MIN_FOLLOWERS_FOR_TRIAL_REELS,
    )


@router.get("/audio", response_model=InstagramAudioSearchResponse)
async def search_instagram_audio(
    q: Optional[str] = Query(None, description="Termo de busca (música, artista ou link do áudio no Instagram)"),
    audio_type: str = Query("music", description="Categoria: music, original_sound ou favorites"),
    after: Optional[str] = Query(None, description="Cursor de paginação para carregar mais faixas"),
    db: Session = Depends(get_db),
):
    """
    Lista até 100 músicas por página do catálogo oficial da Meta (/ig_audio com limit=100),
    filtra de verdade por termo de busca em todo o catálogo (Músicas + Áudios Originais + Favoritos),
    ou importa pelo link oficial do áudio do Instagram Reels.
    """
    normalized_type = (audio_type or "music").strip().lower()
    if normalized_type not in ("music", "original_sound", "favorites"):
        raise HTTPException(
            status_code=400,
            detail="Parâmetro 'audio_type' inválido. Valores aceitos: 'music', 'original_sound' ou 'favorites'.",
        )

    favorite_ids = _get_favorite_ids(db)
    query_str = (q or "").strip()

    # Se a aba for Favoritos, retorna diretamente do banco (com filtro opcional)
    if normalized_type == "favorites":
        fav_rows = db.query(InstagramFavoriteAudio).order_by(InstagramFavoriteAudio.created_at.desc()).all()
        fav_items = [
            InstagramAudioItem(
                audio_id=r.audio_id,
                title=r.title,
                display_artist=r.display_artist,
                duration_in_ms=r.duration_in_ms or 0,
                audio_type=r.audio_type or "music",
                cover_artwork_thumbnail_uri=r.cover_artwork_thumbnail_uri,
                download_url=r.download_url,
                on_platform_audio_preview_link=r.on_platform_audio_preview_link
                or f"https://www.instagram.com/reels/audio/{r.audio_id}/",
                ig_username=r.ig_username,
                is_favorite=True,
            )
            for r in fav_rows
        ]
        if query_str:
            q_norm = _normalize_text(query_str)
            fav_items = [
                item
                for item in fav_items
                if q_norm in _normalize_text(item.title) or q_norm in _normalize_text(item.display_artist)
            ]
        return InstagramAudioSearchResponse(
            items=fav_items,
            total=len(fav_items),
            source="favorites_db",
            next_cursor=None,
        )

    account_id = (settings.INSTAGRAM_ACCOUNT_ID or "").strip()
    access_token = (settings.INSTAGRAM_ACCESS_TOKEN or "").strip()

    if account_id and access_token and not settings.SIMULATE_PUBLICATIONS:
        try:
            if query_str:
                # Quando o usuário pesquisa um termo, buscamos simultaneamente em Músicas (81) e Áudios Originais (100)
                music_task = _fetch_meta_catalog_category("music", account_id, access_token)
                orig_task = _fetch_meta_catalog_category("original_sound", account_id, access_token)
                (music_items, _), (orig_items, _) = await asyncio.gather(music_task, orig_task)

                seen_ids: Set[str] = set()
                combined: List[InstagramAudioItem] = []
                # Coloca primeiro os da aba ativa, depois os da outra aba
                primary_list = music_items if normalized_type == "music" else orig_items
                secondary_list = orig_items if normalized_type == "music" else music_items

                for track in primary_list + secondary_list:
                    if track.audio_id not in seen_ids:
                        seen_ids.add(track.audio_id)
                        combined.append(track)

                # Verifica se o usuário colou um link/ID direto do Instagram Reels Audio
                extracted_id = _extract_audio_id_from_query(query_str)
                if extracted_id:
                    matched = [t for t in combined if t.audio_id == extracted_id]
                    if not matched:
                        matched = [
                            InstagramAudioItem(
                                audio_id=extracted_id,
                                title=f"Áudio do Instagram #{extracted_id[-6:]}",
                                display_artist="Importado via Link do Instagram",
                                duration_in_ms=0,
                                audio_type=normalized_type,
                                on_platform_audio_preview_link=f"https://www.instagram.com/reels/audio/{extracted_id}/",
                            )
                        ]
                    items = matched
                else:
                    q_norm = _normalize_text(query_str)
                    items = [
                        t
                        for t in combined
                        if q_norm in _normalize_text(t.title)
                        or q_norm in _normalize_text(t.display_artist)
                        or q_norm in _normalize_text(t.ig_username)
                    ]

                next_cursor = None
            else:
                items, next_cursor = await _fetch_meta_catalog_category(
                    normalized_type, account_id, access_token, after_cursor=after
                )

            for item in items:
                item.is_favorite = item.audio_id in favorite_ids

            await _enrich_tracks_with_previews(items, max_enrich=10)

            return InstagramAudioSearchResponse(
                items=items,
                total=len(items),
                source="meta_graph_api",
                next_cursor=next_cursor,
            )
        except Exception as e:
            logger.error(f"[Instagram Audio] Erro ao buscar músicas na Meta Graph API: {e}", exc_info=True)

    # Fallback caso credenciais não estejam ativas ou em modo simulação
    filtered = FALLBACK_AUDIO_TRACKS
    if query_str:
        q_norm = _normalize_text(query_str)
        filtered = [
            t
            for t in FALLBACK_AUDIO_TRACKS
            if q_norm in _normalize_text(t["title"]) or q_norm in _normalize_text(t.get("display_artist"))
        ]

    fallback_items = [
        InstagramAudioItem(**t, is_favorite=(t["audio_id"] in favorite_ids))
        for t in filtered
    ]
    return InstagramAudioSearchResponse(
        items=fallback_items,
        total=len(fallback_items),
        source="fallback",
        next_cursor=None,
    )


@router.get("/audio/favorites", response_model=InstagramAudioSearchResponse)
async def list_favorite_instagram_audios(db: Session = Depends(get_db)):
    """
    Lista todas as músicas e áudios originais salvos nos Favoritos pelo usuário.
    """
    rows = db.query(InstagramFavoriteAudio).order_by(InstagramFavoriteAudio.created_at.desc()).all()
    items = [
        InstagramAudioItem(
            audio_id=r.audio_id,
            title=r.title,
            display_artist=r.display_artist,
            duration_in_ms=r.duration_in_ms or 0,
            audio_type=r.audio_type or "music",
            cover_artwork_thumbnail_uri=r.cover_artwork_thumbnail_uri,
            download_url=r.download_url,
            on_platform_audio_preview_link=r.on_platform_audio_preview_link
            or f"https://www.instagram.com/reels/audio/{r.audio_id}/",
            ig_username=r.ig_username,
            is_favorite=True,
        )
        for r in rows
    ]
    return InstagramAudioSearchResponse(
        items=items,
        total=len(items),
        source="favorites_db",
        next_cursor=None,
    )


@router.post("/audio/favorites", response_model=InstagramAudioItem)
async def add_favorite_instagram_audio(
    payload: InstagramAudioItem,
    db: Session = Depends(get_db),
):
    """
    Adiciona ou atualiza uma música na lista de Favoritos do usuário no banco de dados.
    """
    audio_id = (payload.audio_id or "").strip()
    if not audio_id:
        raise HTTPException(status_code=400, detail="O campo 'audio_id' é obrigatório.")

    download_url = payload.download_url
    artwork_url = payload.cover_artwork_thumbnail_uri

    if not download_url and payload.title:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resolved = await _resolve_external_audio_preview(
                client, audio_id, payload.title, payload.display_artist or ""
            )
            if resolved.get("preview_url"):
                download_url = resolved["preview_url"]
            if not artwork_url and resolved.get("artwork_url"):
                artwork_url = resolved["artwork_url"]

    existing = db.query(InstagramFavoriteAudio).filter(InstagramFavoriteAudio.audio_id == audio_id).first()
    if existing:
        existing.title = payload.title
        existing.display_artist = payload.display_artist
        existing.duration_in_ms = payload.duration_in_ms or 0
        existing.audio_type = payload.audio_type or "music"
        existing.cover_artwork_thumbnail_uri = artwork_url or existing.cover_artwork_thumbnail_uri
        existing.download_url = download_url or existing.download_url
        existing.on_platform_audio_preview_link = (
            payload.on_platform_audio_preview_link
            or f"https://www.instagram.com/reels/audio/{audio_id}/"
        )
        existing.ig_username = payload.ig_username
        record = existing
    else:
        record = InstagramFavoriteAudio(
            audio_id=audio_id,
            title=payload.title,
            display_artist=payload.display_artist,
            duration_in_ms=payload.duration_in_ms or 0,
            audio_type=payload.audio_type or "music",
            cover_artwork_thumbnail_uri=artwork_url,
            download_url=download_url,
            on_platform_audio_preview_link=payload.on_platform_audio_preview_link
            or f"https://www.instagram.com/reels/audio/{audio_id}/",
            ig_username=payload.ig_username,
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    logger.info(f"[Instagram Favorites] Música '{record.title}' ({record.audio_id}) salva nos favoritos.")

    return InstagramAudioItem(
        audio_id=record.audio_id,
        title=record.title,
        display_artist=record.display_artist,
        duration_in_ms=record.duration_in_ms or 0,
        audio_type=record.audio_type or "music",
        cover_artwork_thumbnail_uri=record.cover_artwork_thumbnail_uri,
        download_url=record.download_url,
        on_platform_audio_preview_link=record.on_platform_audio_preview_link,
        ig_username=record.ig_username,
        is_favorite=True,
    )


@router.delete("/audio/favorites/{audio_id}")
async def remove_favorite_instagram_audio(
    audio_id: str,
    db: Session = Depends(get_db),
):
    """
    Remove uma música dos Favoritos do usuário.
    """
    existing = db.query(InstagramFavoriteAudio).filter(InstagramFavoriteAudio.audio_id == audio_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        logger.info(f"[Instagram Favorites] Música {audio_id} removida dos favoritos.")
    return {"success": True, "audio_id": audio_id}


@router.get("/audio/stream")
async def stream_instagram_audio_preview(
    audio_id: str = Query("", description="ID do áudio no Instagram"),
    title: str = Query("", description="Título da música"),
    artist: str = Query("", description="Artista da música"),
    url: Optional[str] = Query(None, description="URL direta da prévia caso já disponível"),
):
    """
    Faz proxy de streaming do áudio de prévia (evitando bloqueios CORS/CORP do navegador)
    ou resolve automaticamente a URL de prévia por título e artista caso a Meta não tenha retornado.
    """
    target_url = (url or "").strip()

    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
        if not target_url and (title or artist):
            resolved = await _resolve_external_audio_preview(client, audio_id, title, artist)
            target_url = resolved.get("preview_url") or ""

        if not target_url:
            raise HTTPException(
                status_code=404,
                detail="Prévia de áudio não disponível para esta faixa.",
            )

        try:
            audio_resp = await client.get(
                target_url,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            if audio_resp.status_code >= 400 and title:
                resolved = await _resolve_external_audio_preview(client, audio_id, title, artist)
                fallback_url = resolved.get("preview_url")
                if fallback_url and fallback_url != target_url:
                    audio_resp = await client.get(fallback_url, headers={"User-Agent": "Mozilla/5.0"})

            if audio_resp.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail="Não foi possível carregar o stream de áudio da faixa.",
                )

            content_type = audio_resp.headers.get("content-type") or "audio/mp4"
            return Response(
                content=audio_resp.content,
                media_type=content_type,
                headers={
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "public, max-age=3600",
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[Instagram Audio Stream] Erro ao transmitir prévia '{title}': {e}")
            raise HTTPException(status_code=502, detail="Erro ao reproduzir prévia de áudio.")
