import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app.models import Post, PlatformPublication, PostMetricSnapshot, PostStatus, PublicationStatus, PlatformType
from app.services.metrics_collector import MetricsCollectorService

def utcnow():
    return datetime.now(timezone.utc)

def test_analytics_summary_endpoint(client):
    """Valida que o endpoint GET /api/analytics/summary responde com a estrutura consolidada esperada."""
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_views" in data
    assert "total_likes" in data
    assert "total_comments" in data
    assert "total_shares" in data
    assert "by_platform" in data

def test_sync_single_post_not_found(client):
    """Valida que o endpoint retorna 404 para um post inexistente."""
    response = client.post("/api/analytics/posts/999999/sync")
    assert response.status_code == 404
    assert response.json()["detail"] == "Publicação não encontrada."

@pytest.mark.asyncio
async def test_fetch_youtube_metrics_mocked():
    """Testa a extração de métricas do YouTube com resposta HTTP mockada."""
    service = MetricsCollectorService()

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "items": [
            {
                "statistics": {
                    "viewCount": "1540",
                    "likeCount": "120",
                    "commentCount": "25"
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        metrics = await service.fetch_youtube_metrics("test_video_123", "fake_token")
        assert metrics["views"] == 1540
        assert metrics["likes"] == 120
        assert metrics["comments"] == 25
        assert metrics["retention_rate_pct"] > 0

@pytest.mark.asyncio
async def test_fetch_instagram_metrics_mocked():
    """Testa a extração de métricas do Instagram com resposta básica e insights mockados."""
    service = MetricsCollectorService()

    mock_basic = MagicMock()
    mock_basic.status_code = 200
    mock_basic.json.return_value = {"like_count": 85, "comments_count": 12}

    mock_insights = MagicMock()
    mock_insights.status_code = 200
    mock_insights.json.return_value = {
        "data": [
            {"name": "plays", "values": [{"value": 950}]},
            {"name": "reach", "values": [{"value": 890}]},
            {"name": "saved", "values": [{"value": 45}]},
            {"name": "shares", "values": [{"value": 30}]},
        ]
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        # Alterna entre resposta básica e insights
        mock_get.side_effect = [mock_basic, mock_insights]
        metrics = await service.fetch_instagram_metrics("media_123", "fake_token")

        assert metrics["likes"] == 85
        assert metrics["comments"] == 12
        assert metrics["views"] == 950
        assert metrics["reach"] == 890
        assert metrics["saves"] == 45
        assert metrics["shares"] == 30

@pytest.mark.asyncio
async def test_sync_publication_metrics_in_database(db_session):
    """Cria uma publicação publicada de teste e valida que o snapshot é persistido no banco."""
    # 1. Cria post e publication
    post = Post(
        title="Post Teste Analytics",
        video_filename="video.mp4",
        video_path="uploads/video.mp4",
        status=PostStatus.PUBLISHED.value,
        scheduled_at=utcnow()
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    pub = PlatformPublication(
        post_id=post.id,
        platform=PlatformType.YOUTUBE.value,
        status=PublicationStatus.PUBLISHED.value,
        external_post_id="yt_vid_test_999",
        published_at=utcnow()
    )
    db_session.add(pub)
    db_session.commit()
    db_session.refresh(pub)

    service = MetricsCollectorService()

    # Mocka a chamada ao YouTube
    with patch.object(service, "fetch_youtube_metrics", new_callable=AsyncMock) as mock_yt:
        mock_yt.return_value = {
            "views": 2500,
            "likes": 320,
            "comments": 42,
            "shares": 0,
            "retention_rate_pct": 68.5,
            "ctr_pct": 5.2
        }
        with patch.object(service.youtube_publisher, "get_access_token", new_callable=AsyncMock) as mock_token:
            mock_token.return_value = "valid_token"

            snapshot = await service.sync_publication_metrics(pub, db_session)
            assert snapshot is not None
            assert snapshot.views == 2500
            assert snapshot.likes == 320

            # Valida que as colunas consolidadas da publicação foram atualizadas
            db_session.refresh(pub)
            assert pub.last_views == 2500
            assert pub.last_likes == 320
            assert pub.last_metrics_sync_at is not None

    # Limpeza
    db_session.delete(post)
    db_session.commit()

def test_get_channel_winning_formula_endpoint(client):
    """Valida que o endpoint GET /api/analytics/winning-formula responde com os dados da fórmula vencedora."""
    response = client.get("/api/analytics/winning-formula")
    assert response.status_code == 200
    data = response.json()
    assert "top_performing_pattern" in data
    assert "best_hook_example" in data
    assert "key_rules" in data
    assert isinstance(data["key_rules"], list)

def test_get_post_ai_diagnosis_endpoint(client, db_session):
    """Valida que o endpoint GET /api/analytics/posts/{id}/diagnosis retorna o Raio-X do vídeo."""
    post = Post(
        title="Como Ganhar Mais Dinheiro Online",
        transcription="Você sabia que 90% das pessoas erram feio ao criar conteúdo? Hoje vou te mostrar o segredo.",
        video_filename="teste_ia.mp4",
        video_path="uploads/teste_ia.mp4",
        status=PostStatus.PUBLISHED.value,
        scheduled_at=utcnow()
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    response = client.get(f"/api/analytics/posts/{post.id}/diagnosis")
    assert response.status_code == 200
    data = response.json()
    assert data["post_id"] == post.id
    assert "hook_score" in data
    assert data["hook_score"] >= 7.0 # Teve pergunta e gatilho de curiosidade
    assert "hook_verdict" in data
    assert "why_it_performed" in data
    assert len(data["weaknesses"]) >= 2
    assert len(data["what_to_do_next"]) >= 2

    # Limpeza
    db_session.delete(post)
    db_session.commit()

def test_generate_post_script_variations_endpoint(client, db_session):
    """Valida a geração de 5 variações completas de roteiro via POST /api/analytics/posts/{id}/generate-scripts."""
    post = Post(
        title="Roteiro Campeão para Redes Sociais",
        transcription="Neste vídeo revelo o método definitivo para crescer no YouTube Shorts.",
        video_filename="teste_roteiro.mp4",
        video_path="uploads/teste_roteiro.mp4",
        status=PostStatus.PUBLISHED.value,
        scheduled_at=utcnow()
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    response = client.post(f"/api/analytics/posts/{post.id}/generate-scripts")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["scripts"]) == 5
    first_script = data["scripts"][0]
    assert "hook" in first_script
    assert "body" in first_script
    assert "cta" in first_script
    assert "why_it_works" in first_script

    # Limpeza
    db_session.delete(post)
    db_session.commit()

@pytest.mark.asyncio
async def test_sync_instagram_publication_saves_and_post_totals(client, db_session):
    """Valida que o sync de publicação do Instagram salva last_saves e atualiza as properties do Post."""
    post = Post(
        title="Post Instagram com Salvamentos",
        video_filename="insta_saves.mp4",
        video_path="uploads/insta_saves.mp4",
        status=PostStatus.PUBLISHED.value,
        scheduled_at=utcnow()
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    pub = PlatformPublication(
        post_id=post.id,
        platform=PlatformType.INSTAGRAM.value,
        status=PublicationStatus.PUBLISHED.value,
        external_post_id="insta_media_999",
        published_at=utcnow()
    )
    db_session.add(pub)
    db_session.commit()
    db_session.refresh(pub)

    service = MetricsCollectorService()

    with patch.object(service, "fetch_instagram_metrics", new_callable=AsyncMock) as mock_ig:
        mock_ig.return_value = {
            "views": 4500,
            "likes": 520,
            "comments": 78,
            "shares": 34,
            "saves": 115,
            "reach": 4100
        }
        with patch("app.services.metrics_collector.settings.INSTAGRAM_ACCESS_TOKEN", "fake_insta_token"):
            snapshot = await service.sync_publication_metrics(pub, db_session)
            assert snapshot is not None
            assert snapshot.saves == 115
            assert snapshot.likes == 520

            db_session.refresh(pub)
            assert pub.last_saves == 115
            assert pub.last_likes == 520
            assert pub.last_comments == 78
            assert pub.last_shares == 34
            assert pub.last_views == 4500

            # Verifica properties dinâmicas no modelo Post
            db_session.refresh(post)
            assert post.total_saves == 115
            assert post.total_likes == 520
            assert post.total_comments == 78
            assert post.total_shares == 34
            assert post.total_views == 4500

    # Teste de endpoint de sync via client
    with patch("app.api.analytics.metrics_collector.sync_publication_metrics", new_callable=AsyncMock) as mock_sync_pub:
        from app.models import PostMetricSnapshot
        fake_snap = PostMetricSnapshot(
            publication_id=pub.id,
            platform="instagram",
            views=4500,
            likes=520,
            comments=78,
            shares=34,
            saves=115,
            collected_at=utcnow()
        )
        mock_sync_pub.return_value = fake_snap

        resp = client.post(f"/api/analytics/posts/{post.id}/sync")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["synchronized_platforms"]) == 1
        assert data["synchronized_platforms"][0]["saves"] == 115

    # Limpeza
    db_session.delete(post)
    db_session.commit()

