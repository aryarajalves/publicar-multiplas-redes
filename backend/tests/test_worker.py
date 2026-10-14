import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, AsyncMock
from app.models import Post, PlatformPublication, PostStatus, PlatformType, PublicationStatus
from app.worker.tasks import execute_publication_pipeline, process_due_posts_sync
from app.publishers.base import PublicationResult

@pytest.mark.asyncio
async def test_publication_pipeline_instagram_success_with_crossposting(db_session):
    # Cria post com Instagram, YouTube e TikTok
    post = Post(
        title="Pipeline Cross-post Test",
        caption="Post em todas as redes",
        video_filename="video.mp4",
        video_path="test_uploads/video.mp4",
        status=PostStatus.SCHEDULED.value,
        scheduled_at=datetime.now(timezone.utc)
    )
    db_session.add(post)
    db_session.flush()

    for plat in [PlatformType.INSTAGRAM.value, PlatformType.YOUTUBE.value, PlatformType.TIKTOK.value]:
        pub = PlatformPublication(post_id=post.id, platform=plat, status=PublicationStatus.PENDING.value)
        db_session.add(pub)

    db_session.commit()
    db_session.refresh(post)

    success = await execute_publication_pipeline(post.id, db_session)
    assert success is True

    db_session.refresh(post)
    assert post.status == PostStatus.PUBLISHED.value
    for pub in post.publications:
        assert pub.status == PublicationStatus.PUBLISHED.value
        assert pub.post_url is not None
        assert pub.published_at is not None

@pytest.mark.asyncio
async def test_publication_pipeline_instagram_failure_skips_crossposting(db_session):
    post = Post(
        title="Post com Falha no Instagram",
        caption="Teste de fallback",
        video_filename="video_fail.mp4",
        video_path="test_uploads/video_fail.mp4",
        status=PostStatus.SCHEDULED.value,
        scheduled_at=datetime.now(timezone.utc)
    )
    db_session.add(post)
    db_session.flush()

    for plat in [PlatformType.INSTAGRAM.value, PlatformType.YOUTUBE.value]:
        pub = PlatformPublication(post_id=post.id, platform=plat, status=PublicationStatus.PENDING.value)
        db_session.add(pub)

    db_session.commit()
    db_session.refresh(post)

    # Força falha no Instagram Publisher
    with patch("app.worker.tasks.get_publisher") as mock_get_pub:
        mock_ig_pub = AsyncMock()
        mock_ig_pub.publish.return_value = PublicationResult(
            success=False,
            error_message="Falha simulada na API do Instagram"
        )
        mock_get_pub.return_value = mock_ig_pub

        success = await execute_publication_pipeline(post.id, db_session)
        assert success is False

    db_session.refresh(post)
    assert post.status == PostStatus.FAILED.value
    ig_pub = next(p for p in post.publications if p.platform == PlatformType.INSTAGRAM.value)
    yt_pub = next(p for p in post.publications if p.platform == PlatformType.YOUTUBE.value)
    assert ig_pub.status == PublicationStatus.FAILED.value
    assert yt_pub.status == PublicationStatus.SKIPPED.value
    assert "Instagram falhou" in yt_pub.error_message

def test_process_due_posts_sync(db_session):
    # Post vencido (deve ser processado)
    due_post = Post(
        title="Post Vencido",
        video_filename="v1.mp4",
        video_path="test_uploads/v1.mp4",
        status=PostStatus.SCHEDULED.value,
        scheduled_at=datetime.now(timezone.utc) - timedelta(minutes=5)
    )
    # Post futuro (não deve ser processado)
    future_post = Post(
        title="Post Futuro",
        video_filename="v2.mp4",
        video_path="test_uploads/v2.mp4",
        status=PostStatus.SCHEDULED.value,
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=2)
    )
    db_session.add_all([due_post, future_post])
    db_session.flush()

    due_pub = PlatformPublication(post_id=due_post.id, platform="instagram", status="pending")
    future_pub = PlatformPublication(post_id=future_post.id, platform="instagram", status="pending")
    db_session.add_all([due_pub, future_pub])
    db_session.commit()

    processed_count = process_due_posts_sync(db_session)
    assert processed_count == 1

    db_session.refresh(due_post)
    db_session.refresh(future_post)
    assert due_post.status == PostStatus.PUBLISHED.value
    assert future_post.status == PostStatus.SCHEDULED.value
