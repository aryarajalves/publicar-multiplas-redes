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
