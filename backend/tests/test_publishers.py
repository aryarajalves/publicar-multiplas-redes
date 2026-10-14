import pytest
from datetime import datetime, timezone
from app.models import Post, PlatformPublication, PlatformType
from app.publishers import get_publisher, InstagramPublisher, YouTubePublisher, TikTokPublisher

def create_sample_post():
    return Post(
        id=99,
        title="Dica Incrível de IA",
        caption="Aprenda a agendar reels com IA #instagram #reels",
        video_filename="video_test.mp4",
        video_path="test_uploads/video_test.mp4",
        scheduled_at=datetime.now(timezone.utc)
    )

@pytest.mark.asyncio
async def test_instagram_publisher_simulation():
    publisher = get_publisher("instagram")
    assert isinstance(publisher, InstagramPublisher)
    assert publisher.platform_name == "instagram"

    post = create_sample_post()
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.INSTAGRAM.value)
    
    result = await publisher.publish(post, pub)
    assert result.success is True
    assert result.external_post_id is not None
    assert "instagram.com/reel" in result.post_url
    assert result.error_message is None

@pytest.mark.asyncio
async def test_youtube_publisher_simulation():
    publisher = get_publisher("youtube")
    assert isinstance(publisher, YouTubePublisher)
    assert publisher.platform_name == "youtube"

    post = create_sample_post()
    post.youtube_video_type = "Shorts"
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.YOUTUBE.value)
    
    result = await publisher.publish(post, pub)
    assert result.success is True
    assert "youtube.com/shorts" in result.post_url

@pytest.mark.asyncio
async def test_youtube_publisher_simulation_long_video():
    publisher = get_publisher("youtube")
    post = create_sample_post()
    post.youtube_video_type = "Vídeo Padrão"
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.YOUTUBE.value)
    
    result = await publisher.publish(post, pub)
    assert result.success is True
    assert "youtube.com/watch?v=" in result.post_url

@pytest.mark.asyncio
async def test_tiktok_publisher_simulation():
    publisher = get_publisher("tiktok")
    assert isinstance(publisher, TikTokPublisher)
    assert publisher.platform_name == "tiktok"

    post = create_sample_post()
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.TIKTOK.value)
    
    result = await publisher.publish(post, pub)
    assert result.success is True
    assert "tiktok.com" in result.post_url

@pytest.mark.asyncio
async def test_instagram_publisher_unconfigured(monkeypatch):
    publisher = get_publisher("instagram")
    from app.config import settings
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", None)
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", None)

    post = create_sample_post()
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.INSTAGRAM.value)

    result = await publisher.publish(post, pub)
    assert result.success is False
    assert "Credenciais do Instagram não configuradas" in result.error_message

@pytest.mark.asyncio
async def test_tiktok_publisher_unconfigured(monkeypatch):
    publisher = get_publisher("tiktok")
    from app.config import settings
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "TIKTOK_ACCESS_TOKEN", None)

    post = create_sample_post()
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.TIKTOK.value)

    result = await publisher.publish(post, pub)
    assert result.success is False
    assert "Credenciais do TikTok não configuradas" in result.error_message

@pytest.mark.asyncio
async def test_youtube_get_access_token(monkeypatch):
    publisher = get_publisher("youtube")
    from app.config import settings
    monkeypatch.setattr(settings, "YOUTUBE_CLIENT_ID", "test_id")
    monkeypatch.setattr(settings, "YOUTUBE_CLIENT_SECRET", "test_secret")
    monkeypatch.setattr(settings, "YOUTUBE_REFRESH_TOKEN", "test_refresh")

    class MockResponse:
        status_code = 200
        def json(self):
            return {"access_token": "ya29.mock_token_123"}

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
    token = await publisher.get_access_token()
    assert token == "ya29.mock_token_123"

@pytest.mark.asyncio
async def test_youtube_publisher_real_resumable_upload(monkeypatch, tmp_path):
    publisher = get_publisher("youtube")
    from app.config import settings
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "YOUTUBE_CLIENT_ID", "test_id")
    monkeypatch.setattr(settings, "YOUTUBE_CLIENT_SECRET", "test_secret")
    monkeypatch.setattr(settings, "YOUTUBE_REFRESH_TOKEN", "test_refresh")

    # Cria arquivo de vídeo temporário
    test_video = tmp_path / "test_video.mp4"
    test_video.write_bytes(b"fake video binary stream")

    post = create_sample_post()
    post.video_path = str(test_video)
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.YOUTUBE.value)

    class MockInitResponse:
        status_code = 200
        headers = {"Location": "https://upload.youtube.com/upload_session_456"}

    class MockUploadResponse:
        status_code = 200
        def json(self):
            return {"id": "yt_real_vid_789"}

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            return MockInitResponse()
        async def put(self, url, **kwargs):
            return MockUploadResponse()

    async def mock_get_token():
        return "mock_access_token_abc"

    monkeypatch.setattr(publisher, "get_access_token", mock_get_token)
    monkeypatch.setattr("httpx.AsyncClient", MockClient)

    result = await publisher.publish(post, pub)
    assert result.success is True
    assert result.external_post_id == "yt_real_vid_789"
    assert "https://www.youtube.com/shorts/yt_real_vid_789" == result.post_url

@pytest.mark.asyncio
async def test_youtube_publisher_includes_related_video_in_description(monkeypatch, tmp_path):
    publisher = get_publisher("youtube")
    from app.config import settings
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "YOUTUBE_CLIENT_ID", "test_id")
    monkeypatch.setattr(settings, "YOUTUBE_CLIENT_SECRET", "test_secret")
    monkeypatch.setattr(settings, "YOUTUBE_REFRESH_TOKEN", "test_refresh")

    test_video = tmp_path / "test_related.mp4"
    test_video.write_bytes(b"video content")

    post = create_sample_post()
    post.video_path = str(test_video)
    post.youtube_video_type = "Vídeo Padrão"
    post.youtube_related_video = "https://youtube.com/watch?v=final123"
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.YOUTUBE.value)

    captured_payload = {}

    class MockInitResponse:
        status_code = 200
        headers = {"Location": "https://upload.youtube.com/upload_session_related"}

    class MockUploadResponse:
        status_code = 200
        def json(self):
            return {"id": "yt_related_vid_999"}

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            nonlocal captured_payload
            captured_payload = kwargs.get("json", {})
            return MockInitResponse()
        async def put(self, url, **kwargs):
            return MockUploadResponse()

    async def mock_get_token():
        return "mock_token"

    monkeypatch.setattr(publisher, "get_access_token", mock_get_token)
    monkeypatch.setattr("httpx.AsyncClient", MockClient)

    result = await publisher.publish(post, pub)
    assert result.success is True
    assert "🎬 Vídeo Recomendado no Final: https://youtube.com/watch?v=final123" in captured_payload["snippet"]["description"]
    assert "https://www.youtube.com/watch?v=yt_related_vid_999" == result.post_url

def test_invalid_publisher():
    with pytest.raises(ValueError) as exc_info:
        get_publisher("twitter_x")
    assert "não suportada" in str(exc_info.value)

def test_parse_youtube_duration_to_seconds():
    from app.publishers.youtube import parse_youtube_duration_to_seconds
    assert parse_youtube_duration_to_seconds("PT6M11S") == 371
    assert parse_youtube_duration_to_seconds("PT9M21S") == 561
    assert parse_youtube_duration_to_seconds("PT1H2M10S") == 3730
    assert parse_youtube_duration_to_seconds("PT45S") == 45
    assert parse_youtube_duration_to_seconds("") == 0
    assert parse_youtube_duration_to_seconds("invalid") == 0

def test_format_seconds_to_duration():
    from app.publishers.youtube import format_seconds_to_duration
    assert format_seconds_to_duration(0) == "0:00"
    assert format_seconds_to_duration(45) == "0:45"
    assert format_seconds_to_duration(371) == "6:11"
    assert format_seconds_to_duration(561) == "9:21"
    assert format_seconds_to_duration(3665) == "1:01:05"

@pytest.mark.asyncio
async def test_youtube_publisher_list_channel_long_videos(monkeypatch):
    from app.publishers.youtube import YouTubePublisher
    publisher = YouTubePublisher()

    async def mock_get_token():
        return "mock_valid_token"

    class MockChannelResponse:
        status_code = 200
        def json(self):
            return {"items": [{"contentDetails": {"relatedPlaylists": {"uploads": "UU_test_uploads_id"}}}]}

    class MockPlaylistResponse:
        status_code = 200
        def json(self):
            return {
                "items": [
                    {"contentDetails": {"videoId": "long_vid_1"}},
                    {"contentDetails": {"videoId": "short_vid_2"}},
                    {"contentDetails": {"videoId": "long_vid_3"}}
                ]
            }

    class MockVideosResponse:
        status_code = 200
        def json(self):
            return {
                "items": [
                    {
                        "id": "long_vid_1",
                        "snippet": {
                            "title": "Como Ter um Player Próprio Igual ao VTurb",
                            "publishedAt": "2026-10-09T17:36:23Z",
                            "thumbnails": {"high": {"url": "https://img.youtube.com/vi/long_vid_1/hqdefault.jpg"}}
                        },
                        "contentDetails": {"duration": "PT9M21S"}  # 561s > 185s -> Longo
                    },
                    {
                        "id": "short_vid_2",
                        "snippet": {"title": "Shorts de 30s", "publishedAt": "2026-10-10T12:00:00Z", "thumbnails": {}},
                        "contentDetails": {"duration": "PT30S"}  # 30s <= 60s -> Short
                    },
                    {
                        "id": "borderline_short_3",
                        "snippet": {"title": "Short vertical de 70s", "publishedAt": "2026-10-11T12:00:00Z", "thumbnails": {}},
                        "contentDetails": {"duration": "PT1M10S"}  # 70s -> Short via head
                    },
                    {
                        "id": "long_vid_4",
                        "snippet": {
                            "title": "Agente de IA no WhatsApp",
                            "publishedAt": "2026-10-12T17:52:19Z",  # Mais recente!
                            "thumbnails": {}
                        },
                        "contentDetails": {"duration": "PT6M11S"}  # 371s > 185s -> Longo
                    }
                ]
            }

    class MockHeadResponse:
        def __init__(self, status_code):
            self.status_code = status_code

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, url, **kwargs):
            if "channels" in url:
                return MockChannelResponse()
            elif "playlistItems" in url:
                return MockPlaylistResponse()
            elif "videos" in url:
                return MockVideosResponse()
            return MockChannelResponse()
        async def head(self, url, **kwargs):
            # Se for borderline_short_3 retorna 200 (Short), caso contrário 303 (Longo)
            if "borderline_short_3" in url:
                return MockHeadResponse(200)
            return MockHeadResponse(303)

    monkeypatch.setattr(publisher, "get_access_token", mock_get_token)
    monkeypatch.setattr("httpx.AsyncClient", MockClient)

    videos = await publisher.list_channel_long_videos()
    assert len(videos) == 2
    # Verifica que o mais recente (12/10) vem no topo (do último vídeo publicado pra cima!)
    assert videos[0]["youtube_id"] == "long_vid_4"
    assert videos[0]["title"] == "Agente de IA no WhatsApp"
    assert videos[0]["duration_formatted"] == "6:11"
    # O segundo é 09/10
    assert videos[1]["youtube_id"] == "long_vid_1"
    assert videos[1]["title"] == "Como Ter um Player Próprio Igual ao VTurb"
    assert videos[1]["duration_formatted"] == "9:21"

