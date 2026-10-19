from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Post, PlatformPublication, PostStatus, PlatformType, PublicationStatus
from app.schemas import PlatformOverviewResponse, PlatformStatusItem
from app.publishers import get_publisher

router = APIRouter(prefix="/platforms", tags=["Platforms"])

@router.get("/overview", response_model=PlatformOverviewResponse)
def get_platforms_overview(db: Session = Depends(get_db)):
    """
    Retorna métricas gerais de publicações para o painel de controle:
    Total de posts, agendados, publicados e detalhamento por plataforma.
    """
    total_posts = db.query(Post).count()
    total_scheduled = db.query(Post).filter(Post.status == PostStatus.SCHEDULED.value).count()
    total_published = db.query(Post).filter(Post.status == PostStatus.PUBLISHED.value).count()
    total_failed = db.query(Post).filter(Post.status == PostStatus.FAILED.value).count()

    platforms_stats = []
    for plat in PlatformType:
        publisher = get_publisher(plat.value)
        configured = publisher.is_configured()

        pub_published = (
            db.query(PlatformPublication)
            .filter(
                PlatformPublication.platform == plat.value,
                PlatformPublication.status == PublicationStatus.PUBLISHED.value
            )
            .count()
        )
        pub_pending = (
            db.query(PlatformPublication)
            .filter(
                PlatformPublication.platform == plat.value,
                PlatformPublication.status.in_([PublicationStatus.PENDING.value, PublicationStatus.IN_PROGRESS.value])
            )
            .count()
        )
        pub_failed = (
            db.query(PlatformPublication)
            .filter(
                PlatformPublication.platform == plat.value,
                PlatformPublication.status == PublicationStatus.FAILED.value
            )
            .count()
        )

        platforms_stats.append(
            PlatformStatusItem(
                platform=plat,
                configured=configured,
                total_published=pub_published,
                total_pending=pub_pending,
                total_failed=pub_failed
            )
        )

    return PlatformOverviewResponse(
        total_posts=total_posts,
        total_scheduled=total_scheduled,
        total_published=total_published,
        total_failed=total_failed,
        platforms=platforms_stats
    )


# ==========================================
# ROTAS DE PERFIS E SEGUIDORES EM TEMPO REAL
# ==========================================

from fastapi import Query
from app.schemas import (
    YouTubeProfileResponse,
    TikTokProfileResponse,
    InstagramProfileResponse,
    UnifiedProfilesResponse,
)
from app.services.profiles_service import (
    get_all_profiles_data,
    get_youtube_profile_data,
    get_tiktok_profile_data,
    get_instagram_profile_data,
)


@router.get("/profiles", response_model=UnifiedProfilesResponse)
async def get_all_platforms_profiles(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache"),
    db: Session = Depends(get_db),
):
    """
    Retorna em uma única requisição os perfis e contadores de seguidores/inscritos
    do Instagram, YouTube e TikTok em tempo real.
    """
    return await get_all_profiles_data(force_refresh=force_refresh, db=db)


@router.get("/youtube/profile", response_model=YouTubeProfileResponse)
async def get_platforms_youtube_profile(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache"),
):
    """
    Retorna dados do canal do YouTube conectado e quantidade de inscritos.
    """
    return await get_youtube_profile_data(force_refresh=force_refresh)


@router.get("/tiktok/profile", response_model=TikTokProfileResponse)
async def get_platforms_tiktok_profile(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache"),
    db: Session = Depends(get_db),
):
    """
    Retorna dados do perfil do TikTok e quantidade de seguidores.
    """
    return await get_tiktok_profile_data(force_refresh=force_refresh, db=db)


@router.get("/instagram/profile", response_model=InstagramProfileResponse)
async def get_platforms_instagram_profile(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache"),
):
    """
    Retorna dados do perfil do Instagram e quantidade de seguidores.
    """
    return await get_instagram_profile_data(force_refresh=force_refresh)


# Sub-routers dedicados com prefixos /youtube e /tiktok para chamadas diretas REST
youtube_router = APIRouter(prefix="/youtube", tags=["YouTube"])
tiktok_router = APIRouter(prefix="/tiktok", tags=["TikTok"])


@youtube_router.get("/profile", response_model=YouTubeProfileResponse)
async def get_direct_youtube_profile(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache"),
):
    return await get_youtube_profile_data(force_refresh=force_refresh)


@tiktok_router.get("/profile", response_model=TikTokProfileResponse)
async def get_direct_tiktok_profile(
    force_refresh: bool = Query(False, description="Força atualização ignorando cache"),
    db: Session = Depends(get_db),
):
    return await get_tiktok_profile_data(force_refresh=force_refresh, db=db)

