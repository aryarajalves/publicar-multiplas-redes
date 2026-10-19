import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Post, PlatformPublication, PostStatus, PlatformType, PublicationStatus
from app.publishers import get_publisher

logger = logging.getLogger("worker.tasks")

def utcnow():
    return datetime.now(timezone.utc)

async def execute_publication_pipeline(post_id: int, db: Session) -> bool:
    """
    Executes the publication pipeline for a post:
    1. First publishes to Instagram.
    2. Once Instagram publishes successfully, triggers automatic cross-posting to YouTube and TikTok.
    3. Updates database status accordingly.
    """
    post: Post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        logger.error(f"Post #{post_id} não encontrado para publicação.")
        return False

    if post.status == PostStatus.CANCELLED.value:
        logger.info(f"Post #{post_id} foi cancelado. Abortando publicação.")
        return False

    post.status = PostStatus.PUBLISHING.value
    db.commit()
    db.refresh(post)

    publications = {pub.platform: pub for pub in post.publications}
    
    # 1. Instagram Primeiro
    ig_pub = publications.get(PlatformType.INSTAGRAM.value)
    ig_success = True

    if ig_pub and ig_pub.status != PublicationStatus.PUBLISHED.value:
        ig_pub.status = PublicationStatus.IN_PROGRESS.value
        db.commit()

        publisher = get_publisher(PlatformType.INSTAGRAM.value)
        result = await publisher.publish(post, ig_pub)

        # Re-vincula ig_pub à sessão atual para evitar desconexão de atributos ORM
        ig_pub = db.query(PlatformPublication).filter(PlatformPublication.id == ig_pub.id).first()
        if not ig_pub:
            return False

        if result.success:
            ig_pub.status = PublicationStatus.PUBLISHED.value
            ig_pub.published_at = utcnow()
            ig_pub.external_post_id = result.external_post_id
            ig_pub.post_url = result.post_url
            ig_pub.error_message = None
            logger.info(f"Post #{post_id} publicado com sucesso no Instagram!")
        else:
            ig_success = False
            ig_pub.status = PublicationStatus.FAILED.value
            ig_pub.error_message = result.error_message
            ig_pub.retry_count = (ig_pub.retry_count or 0) + 1
            logger.error(f"Post #{post_id} falhou ao publicar no Instagram: {result.error_message}")

        db.commit()

    # 2. Cross-posting para YouTube e TikTok (apenas se Instagram teve sucesso ou se Instagram não fazia parte)
    cross_platforms = [PlatformType.YOUTUBE.value, PlatformType.TIKTOK.value]
    
    for plat_name in cross_platforms:
        pub = publications.get(plat_name)
        if not pub or pub.status == PublicationStatus.PUBLISHED.value:
            continue

        if not ig_success:
            # Se a publicação primária do Instagram falhou, o cross-posting não prossegue
            pub.status = PublicationStatus.SKIPPED.value
            pub.error_message = "Cross-posting cancelado porque a publicação no Instagram falhou."
            db.commit()
            continue

        pub.status = PublicationStatus.IN_PROGRESS.value
        db.commit()

        publisher = get_publisher(plat_name)
        result = await publisher.publish(post, pub)

        pub = db.query(PlatformPublication).filter(PlatformPublication.id == pub.id).first()
        if not pub:
            continue

        if result.success:
            pub.status = PublicationStatus.PUBLISHED.value
            pub.published_at = utcnow()
            pub.external_post_id = result.external_post_id
            pub.post_url = result.post_url
            pub.error_message = None
            logger.info(f"Post #{post_id} cross-postado com sucesso no {plat_name}!")
        else:
            pub.status = PublicationStatus.FAILED.value
            pub.error_message = result.error_message
            pub.retry_count += 1
            logger.error(f"Post #{post_id} falhou no cross-posting para {plat_name}: {result.error_message}")

        db.commit()

    # 3. Atualizar Status Geral do Post
    db.refresh(post)
    statuses = [p.status for p in post.publications]
    
    if any(s == PublicationStatus.PUBLISHED.value for s in statuses):
        post.status = PostStatus.PUBLISHED.value
    elif all(s in (PublicationStatus.FAILED.value, PublicationStatus.SKIPPED.value) for s in statuses):
        post.status = PostStatus.FAILED.value
    else:
        post.status = PostStatus.FAILED.value

    db.commit()
    db.refresh(post)
    return post.status == PostStatus.PUBLISHED.value

def process_due_posts_sync(db: Session = None) -> int:
    """
    Checks for all scheduled posts that have reached or passed their scheduled time
    and runs the publication pipeline for them.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        now = utcnow()
        due_posts = (
            db.query(Post)
            .filter(
                Post.status == PostStatus.SCHEDULED.value,
                Post.scheduled_at <= now
            )
            .all()
        )

        count = len(due_posts)
        if count > 0:
            logger.info(f"Encontrados {count} post(s) agendados prontos para publicação.")

        for post in due_posts:
            logger.info(f"Executando post agendado #{post.id} ('{post.title}')...")
            asyncio.run(execute_publication_pipeline(post.id, db))

        return count
    finally:
        if close_db:
            db.close()

def sync_metrics_task_sync(db: Session = None, max_posts: int = 50) -> dict:
    """
    Task síncrona invocada pelo scheduler para sincronizar métricas de todas
    as publicações recentes com as APIs oficiais.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        from app.services.metrics_collector import metrics_collector
        return asyncio.run(metrics_collector.sync_all_recent_published_posts(db, max_posts=max_posts))
    except Exception as e:
        logger.error(f"Erro na execução da sincronização de métricas: {e}", exc_info=True)
        return {"total_checked": 0, "synced": 0, "failed": 0, "error": str(e)}
    finally:
        if close_db:
            db.close()

