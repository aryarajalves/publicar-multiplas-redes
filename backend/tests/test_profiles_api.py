import pytest
from unittest.mock import patch, AsyncMock
from app.services.profiles_service import clear_profiles_cache


@pytest.fixture(autouse=True)
def clean_profiles_cache():
    clear_profiles_cache()
    yield
    clear_profiles_cache()


def test_get_all_platforms_profiles_endpoint(client):
    """Verifica se o endpoint unificado /api/platforms/profiles retorna instagram, youtube e tiktok."""
    res = client.get("/api/platforms/profiles")
    assert res.status_code == 200
    data = res.json()
    assert "instagram" in data
    assert "youtube" in data
    assert "tiktok" in data
    assert "connected" in data["instagram"]
    assert "connected" in data["youtube"]
    assert "connected" in data["tiktok"]
    assert "followers_count" in data["instagram"]
    assert "subscriber_count" in data["youtube"]
    assert "follower_count" in data["tiktok"]


def test_youtube_profile_endpoint_direct(client):
    """Verifica as rotas direta e subordinada de perfil do YouTube."""
    res1 = client.get("/api/youtube/profile")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "connected" in data1
    assert "subscriber_count" in data1

    res2 = client.get("/api/platforms/youtube/profile")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["connected"] == data1["connected"]
    assert data2["subscriber_count"] == data1["subscriber_count"]


def test_tiktok_profile_endpoint_direct(client):
    """Verifica as rotas direta e subordinada de perfil do TikTok."""
    res1 = client.get("/api/tiktok/profile")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "connected" in data1
    assert "follower_count" in data1

    res2 = client.get("/api/platforms/tiktok/profile")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["connected"] == data1["connected"]
    assert data2["follower_count"] == data1["follower_count"]


import httpx


def test_youtube_profile_mocked_success(client):
    """Testa o retorno do perfil do YouTube quando a API da Google retorna dados."""
    mock_channel_response = {
        "items": [
            {
                "id": "UC_test_channel_id",
                "snippet": {
                    "title": "Canal Automotivo Teste",
                    "customUrl": "@focoauto_teste",
                    "thumbnails": {"default": {"url": "https://example.com/yt_thumb.jpg"}},
                },
                "statistics": {
                    "subscriberCount": "1250",
                    "videoCount": "42",
                    "viewCount": "98000",
                },
            }
        ]
    }

    mock_resp = httpx.Response(200, json=mock_channel_response)

    with patch("app.publishers.youtube.YouTubePublisher.is_configured", return_value=True):
        with patch("app.publishers.youtube.YouTubePublisher.get_access_token", new_callable=AsyncMock) as mock_token:
            mock_token.return_value = "fake_access_token"
            with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
                mock_get.return_value = mock_resp
                clear_profiles_cache()
                res = client.get("/api/youtube/profile?force_refresh=true")
                assert res.status_code == 200
                data = res.json()
                assert data["connected"] is True
                assert data["channel_id"] == "UC_test_channel_id"
                assert data["title"] == "Canal Automotivo Teste"
                assert data["custom_url"] == "@focoauto_teste"
                assert data["subscriber_count"] == 1250
                assert data["video_count"] == 42


def test_tiktok_profile_mocked_success(client):
    """Testa o retorno do perfil do TikTok quando a API do TikTok retorna dados."""
    mock_tiktok_response = {
        "data": {
            "user": {
                "open_id": "tk_openid_123",
                "username": "focoauto_oficial",
                "display_name": "Foco Auto Oficial",
                "avatar_url": "https://example.com/tk_avatar.png",
                "follower_count": 3420,
                "following_count": 150,
                "likes_count": 45000,
                "video_count": 88,
            }
        }
    }

    mock_resp = httpx.Response(200, json=mock_tiktok_response)

    with patch("app.publishers.tiktok.TikTokPublisher.is_configured", return_value=True):
        with patch("app.publishers.tiktok.TikTokPublisher.get_valid_access_token", new_callable=AsyncMock) as mock_tk_token:
            mock_tk_token.return_value = "fake_tk_access_token"
            with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
                mock_get.return_value = mock_resp
                clear_profiles_cache()
                res = client.get("/api/tiktok/profile?force_refresh=true")
                assert res.status_code == 200
                data = res.json()
                assert data["connected"] is True
                assert data["open_id"] == "tk_openid_123"
                assert data["username"] == "@focoauto_oficial"
                assert data["display_name"] == "Foco Auto Oficial"
                assert data["follower_count"] == 3420
                assert data["likes_count"] == 45000
