import pytest
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock
import httpx
from app.models import Post, PlatformPublication


@pytest.fixture
def sample_post_with_pubs(db_session):
    post = Post(
        title="Vídeo de Teste de Comentários",
        caption="Legenda de teste",
        video_filename="test_video.mp4",
        video_path="uploads/test_video.mp4",
        scheduled_at=datetime.now(timezone.utc)
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    pub_ig = PlatformPublication(
        post_id=post.id,
        platform="instagram",
        status="published",
        external_post_id="17841400000001",
        post_url="https://instagram.com/reel/xyz123"
    )
    pub_yt = PlatformPublication(
        post_id=post.id,
        platform="youtube",
        status="published",
        external_post_id="dQw4w9WgXcQ",
        post_url="https://youtube.com/shorts/dQw4w9WgXcQ"
    )
    db_session.add_all([pub_ig, pub_yt])
    db_session.commit()
    return post


def test_get_comments_post_not_found(client):
    res = client.get("/api/posts/99999/comments?platform=instagram")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert "Publicação não encontrada" in data["detail"]
    assert data["comments"] == []


def test_get_instagram_comments_success(client, sample_post_with_pubs):
    mock_meta_response = {
        "data": [
            {
                "id": "c1",
                "text": "Adorei o conteúdo!",
                "username": "joaosilva",
                "timestamp": "2026-10-19T18:00:00+0000",
                "like_count": 3,
                "replies": {
                    "data": [
                        {
                            "id": "r1",
                            "text": "Muito obrigado João!",
                            "username": "focoauto.aryaraj",
                            "timestamp": "2026-10-19T18:05:00+0000",
                            "like_count": 1
                        }
                    ]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = httpx.Response(200, json=mock_meta_response)
        with patch("app.config.settings.INSTAGRAM_ACCESS_TOKEN", "fake_token"):
            res = client.get(f"/api/posts/{sample_post_with_pubs.id}/comments?platform=instagram")
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert data["platform"] == "instagram"
            assert data["total_count"] == 1
            assert len(data["comments"]) == 1
            comment = data["comments"][0]
            assert comment["id"] == "c1"
            assert comment["username"] == "joaosilva"
            assert comment["text"] == "Adorei o conteúdo!"
            assert len(comment["replies"]) == 1
            assert comment["replies"][0]["username"] == "focoauto.aryaraj"


def test_get_instagram_comments_missing_permission(client, sample_post_with_pubs):
    mock_meta_err = {
        "error": {
            "message": "(#200) Requires instagram_manage_comments permission",
            "type": "OAuthException",
            "code": 200
        }
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = httpx.Response(400, json=mock_meta_err)
        with patch("app.config.settings.INSTAGRAM_ACCESS_TOKEN", "fake_token"):
            res = client.get(f"/api/posts/{sample_post_with_pubs.id}/comments?platform=instagram")
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is False
            assert "instagram_manage_comments" in data["detail"]


def test_get_youtube_comments_success(client, sample_post_with_pubs):
    mock_yt_response = {
        "items": [
            {
                "id": "yt_c1",
                "snippet": {
                    "topLevelComment": {
                        "id": "yt_c1",
                        "snippet": {
                            "authorDisplayName": "Maria Souza",
                            "authorProfileImageUrl": "https://yt.com/photo.jpg",
                            "textOriginal": "Excelente dica de economia!",
                            "publishedAt": "2026-10-19T18:10:00Z",
                            "likeCount": 5
                        }
                    }
                },
                "replies": {
                    "comments": []
                }
            }
        ]
    }

    with patch("app.publishers.youtube.YouTubePublisher.get_access_token", new_callable=AsyncMock) as mock_token:
        mock_token.return_value = "fake_yt_token"
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = httpx.Response(200, json=mock_yt_response)
            res = client.get(f"/api/posts/{sample_post_with_pubs.id}/comments?platform=youtube")
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert data["platform"] == "youtube"
            assert data["total_count"] == 1
            assert data["comments"][0]["username"] == "Maria Souza"
            assert data["comments"][0]["text"] == "Excelente dica de economia!"


def test_send_instagram_reply_success(client, sample_post_with_pubs):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = httpx.Response(200, json={"id": "reply_123"})
        with patch("app.config.settings.INSTAGRAM_ACCESS_TOKEN", "fake_token"):
            res = client.post(
                f"/api/posts/{sample_post_with_pubs.id}/comments",
                json={
                    "platform": "instagram",
                    "comment_id": "c1",
                    "message": "Obrigado pelo seu comentário!"
                }
            )
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert data["id"] == "reply_123"
