import io
from datetime import datetime, timedelta, timezone
from app.config import settings
import app.api.instagram as ig_api


def test_get_instagram_profile_below_1000_followers(client, monkeypatch):
    """
    Valida que GET /api/instagram/profile retorna os dados da conta e marca
    trial_reels_eligible=False quando followers_count < 1000.
    """
    ig_api.clear_instagram_profile_cache()
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", "mock_token_123")
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", "17841478293157797")

    class MockResponse:
        status_code = 200
        def json(self):
            return {
                "id": "17841478293157797",
                "username": "focoauto.aryaraj",
                "name": "Aryaraj FocoAuto",
                "followers_count": 63,
                "media_count": 2,
                "profile_picture_url": "https://scontent.test/pic.jpg",
            }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, url, **kwargs):
            return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)

    res = client.get("/api/instagram/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is True
    assert data["username"] == "focoauto.aryaraj"
    assert data["account_name"] == "@focoauto.aryaraj"
    assert data["followers_count"] == 63
    assert data["trial_reels_eligible"] is False
    assert data["min_followers_for_trial"] == 1000


def test_get_instagram_profile_above_1000_followers(client, monkeypatch):
    """
    Valida que GET /api/instagram/profile marca trial_reels_eligible=True
    quando followers_count >= 1000.
    """
    ig_api.clear_instagram_profile_cache()
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", "mock_token_123")
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", "17841478293157797")

    class MockResponse:
        status_code = 200
        def json(self):
            return {
                "id": "17841478293157797",
                "username": "focoauto.aryaraj",
                "name": "Aryaraj FocoAuto",
                "followers_count": 1540,
                "media_count": 18,
            }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, url, **kwargs):
            return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)

    res = client.get("/api/instagram/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is True
    assert data["followers_count"] == 1540
    assert data["trial_reels_eligible"] is True


def test_search_instagram_audio_trending_and_query(client, monkeypatch):
    """
    Valida o endpoint GET /api/instagram/audio com listagem trending e busca por termo.
    """
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", True)
    res_trending = client.get("/api/instagram/audio")
    assert res_trending.status_code == 200
    data_trending = res_trending.json()
    assert data_trending["total"] > 0
    assert len(data_trending["items"]) > 0

    res_query = client.get("/api/instagram/audio?q=Blue Moon")
    assert res_query.status_code == 200
    data_query = res_query.json()
    assert any("Blue Moon" in item["title"] for item in data_query["items"])


def test_create_post_with_instagram_music_and_trial_reel(client):
    """
    Valida que POST /api/posts/ salva corretamente os campos de música do Instagram
    e Reels de Teste (Trial Reels).
    """
    fake_video = io.BytesIO(b"fake video content")
    scheduled_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()

    response = client.post(
        "/api/posts/",
        data={
            "title": "Reel com Música e Trial Mode",
            "caption": "Testando áudio e trial reel #reels",
            "scheduled_at": scheduled_time,
            "platforms": "instagram",
            "publish_now": "false",
            "instagram_audio_id": "900100200300105",
            "instagram_audio_title": "brazilian phonk",
            "instagram_audio_artist": "Slowboy",
            "instagram_audio_volume": "90",
            "instagram_video_volume": "35",
            "instagram_is_trial_reel": "true",
            "instagram_trial_graduation_strategy": "SS_PERFORMANCE",
        },
        files={"video": ("reel_music_trial.mp4", fake_video, "video/mp4")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["instagram_audio_id"] == "900100200300105"
    assert data["instagram_audio_title"] == "brazilian phonk"
    assert data["instagram_audio_artist"] == "Slowboy"
    assert data["instagram_audio_volume"] == 90
    assert data["instagram_video_volume"] == 35
    assert data["instagram_is_trial_reel"] is True
    assert data["instagram_trial_graduation_strategy"] == "SS_PERFORMANCE"


def test_stream_instagram_audio_preview(client, monkeypatch):
    """
    Valida que GET /api/instagram/audio/stream transmite os bytes de áudio
    da faixa sem bloqueio CORS/CORP.
    """
    class MockAudioStreamResp:
        status_code = 200
        headers = {"content-type": "audio/mp4"}
        content = b"fake-audio-aac-bytes"

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, url, **kwargs):
            return MockAudioStreamResp()

    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)

    res = client.get(
        "/api/instagram/audio/stream",
        params={
            "audio_id": "1120932070383283",
            "title": "Blue Moon",
            "artist": "Zara Larsson",
            "url": "https://audio-ssl.itunes.apple.com/preview.m4a",
        },
    )
    assert res.status_code == 200
    assert res.content == b"fake-audio-aac-bytes"
    assert "audio" in res.headers.get("content-type", "")


def test_instagram_favorite_audios_crud(client, monkeypatch):
    """
    Valida o fluxo de favoritar uma música (POST /api/instagram/audio/favorites),
    listar favoritas (GET /api/instagram/audio/favorites e audio_type=favorites)
    e remover dos favoritos (DELETE /api/instagram/audio/favorites/{audio_id}).
    """
    res_add = client.post(
        "/api/instagram/audio/favorites",
        json={
            "audio_id": "2818493204964733",
            "title": "Marathon Weekend Warriors",
            "display_artist": "Lyle Workman",
            "duration_in_ms": 251290,
            "audio_type": "music",
            "download_url": "https://example.com/marathon.mp4",
        },
    )
    assert res_add.status_code == 200
    saved = res_add.json()
    assert saved["audio_id"] == "2818493204964733"
    assert saved["is_favorite"] is True

    res_list = client.get("/api/instagram/audio/favorites")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1
    assert any(i["audio_id"] == "2818493204964733" for i in list_data["items"])

    res_tab = client.get("/api/instagram/audio?audio_type=favorites")
    assert res_tab.status_code == 200
    assert any(i["audio_id"] == "2818493204964733" for i in res_tab.json()["items"])

    res_del = client.delete("/api/instagram/audio/favorites/2818493204964733")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True
