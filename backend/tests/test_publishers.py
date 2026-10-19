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


@pytest.mark.asyncio
async def test_instagram_publisher_with_cover_url(monkeypatch, tmp_path):
    """
    Valida que quando o post possui thumbnail vinculada, a cover_url é gerada
    e enviada nos parâmetros da chamada POST /media da Meta Graph API.
    """
    from app.publishers import get_publisher
    from app.config import settings

    publisher = get_publisher("instagram")
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", "mock_ig_token_abc")
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", "17841400000000000")

    post = create_sample_post()
    post.thumbnail_path = "uploads/thumbnails/thumb_test.png"
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.INSTAGRAM.value)

    # Mock das URLs públicas
    monkeypatch.setattr(publisher, "_resolve_public_video_url", lambda p: "https://b2.test.com/video.mp4")
    monkeypatch.setattr(publisher, "_resolve_public_cover_url", lambda p: "https://b2.test.com/cover.png")

    captured_params = {}

    class MockMediaResponse:
        status_code = 200
        def json(self):
            return {"id": "container_123"}

    class MockStatusResponse:
        status_code = 200
        def json(self):
            return {"status_code": "FINISHED"}

    class MockPublishResponse:
        status_code = 200
        def json(self):
            return {"id": "ig_published_456"}

    class MockPermalinkResponse:
        status_code = 200
        def json(self):
            return {"permalink": "https://www.instagram.com/reel/Cxyz987/"}

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            nonlocal captured_params
            if "/media_publish" in url:
                return MockPublishResponse()
            elif "/media" in url:
                captured_params = kwargs.get("params", {})
                return MockMediaResponse()
            return MockMediaResponse()
        async def get(self, url, **kwargs):
            if "container_123" in url:
                return MockStatusResponse()
            elif "ig_published_456" in url:
                return MockPermalinkResponse()
            return MockStatusResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockClient)
    # Evita sleep durante o teste
    async def mock_sleep(s):
        pass
    monkeypatch.setattr("asyncio.sleep", mock_sleep)

    result = await publisher.publish(post, pub)

    assert result.success is True
    assert result.external_post_id == "ig_published_456"
    assert result.post_url == "https://www.instagram.com/reel/Cxyz987/"
    assert "cover_url" in captured_params
    assert captured_params["cover_url"] == "https://b2.test.com/cover.png"
    assert captured_params["media_type"] == "REELS"
    assert captured_params["video_url"] == "https://b2.test.com/video.mp4"


@pytest.mark.asyncio
async def test_instagram_publisher_without_cover_url(monkeypatch):
    """
    Valida que quando o post NÃO possui thumbnail vinculada, a cover_url não é enviada
    nos parâmetros e a chamada ocorre normalmente.
    """
    from app.publishers import get_publisher
    from app.config import settings

    publisher = get_publisher("instagram")
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", "mock_ig_token_abc")
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", "17841400000000000")

    post = create_sample_post()
    post.thumbnail_path = None
    pub = PlatformPublication(post_id=post.id, platform=PlatformType.INSTAGRAM.value)

    monkeypatch.setattr(publisher, "_resolve_public_video_url", lambda p: "https://b2.test.com/video.mp4")

    captured_params = {}

    class MockMediaResponse:
        status_code = 200
        def json(self):
            return {"id": "container_no_cover"}

    class MockStatusResponse:
        status_code = 200
        def json(self):
            return {"status_code": "FINISHED"}

    class MockPublishResponse:
        status_code = 200
        def json(self):
            return {"id": "ig_published_no_cover"}

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            nonlocal captured_params
            if "/media_publish" in url:
                return MockPublishResponse()
            elif "/media" in url:
                captured_params = kwargs.get("params", {})
                return MockMediaResponse()
            return MockMediaResponse()
        async def get(self, url, **kwargs):
            return MockStatusResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockClient)
    async def mock_sleep(s):
        pass
    monkeypatch.setattr("asyncio.sleep", mock_sleep)

    result = await publisher.publish(post, pub)

    assert result.success is True
    assert "cover_url" not in captured_params
    assert captured_params["media_type"] == "REELS"


def test_instagram_resolve_public_cover_url_not_found(monkeypatch):
    """
    Valida que se o arquivo de thumbnail não existir no disco, retorna None suavemente.
    """
    from app.publishers import get_publisher
    publisher = get_publisher("instagram")

    post = create_sample_post()
    post.thumbnail_path = "non_existent_folder/fake_thumb_9999.png"

    cover_url = publisher._resolve_public_cover_url(post)
    assert cover_url is None


@pytest.mark.asyncio
async def test_instagram_publisher_with_music_and_trial_reels(monkeypatch):
    """
    Valida que quando o post possui música (instagram_audio_id) e Reels de Teste (instagram_is_trial_reel),
    os parâmetros audio_configuration e trial_params são enviados como JSON na chamada POST /media (v22.0).
    """
    import json
    from app.publishers import get_publisher
    from app.config import settings

    publisher = get_publisher("instagram")
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", "mock_ig_token_abc")
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", "17841400000000000")

    post = create_sample_post()
    post.instagram_audio_id = "987654321000"
    post.instagram_audio_title = "Corporate Tech Upbeat"
    post.instagram_audio_artist = "Meta Sound Collection"
    post.instagram_audio_volume = 85
    post.instagram_video_volume = 40
    post.instagram_is_trial_reel = True
    post.instagram_trial_graduation_strategy = "SS_PERFORMANCE"

    pub = PlatformPublication(post_id=post.id, platform=PlatformType.INSTAGRAM.value)
    monkeypatch.setattr(publisher, "_resolve_public_video_url", lambda p: "https://b2.test.com/video.mp4")

    captured_params = {}
    captured_url = ""

    class MockMediaResponse:
        status_code = 200
        def json(self):
            return {"id": "container_trial_music_123"}

    class MockStatusResponse:
        status_code = 200
        def json(self):
            return {"status_code": "FINISHED"}

    class MockPublishResponse:
        status_code = 200
        def json(self):
            return {"id": "ig_published_trial_456"}

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            nonlocal captured_params, captured_url
            if "/media_publish" in url:
                return MockPublishResponse()
            elif "/media" in url:
                captured_url = url
                captured_params = kwargs.get("params", {})
                return MockMediaResponse()
            return MockMediaResponse()
        async def get(self, url, **kwargs):
            return MockStatusResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockClient)
    async def mock_sleep(s):
        pass
    monkeypatch.setattr("asyncio.sleep", mock_sleep)

    result = await publisher.publish(post, pub)

    assert result.success is True
    assert "v22.0" in captured_url
    assert "audio_configuration" in captured_params
    audio_cfg = json.loads(captured_params["audio_configuration"])
    assert audio_cfg["audio_id"] == "987654321000"
    assert audio_cfg["audio_volume"] == 85
    assert audio_cfg["video_volume"] == 40

    assert "trial_params" in captured_params
    trial_cfg = json.loads(captured_params["trial_params"])
    assert trial_cfg["graduation_strategy"] == "SS_PERFORMANCE"

@pytest.mark.asyncio
async def test_instagram_fallback_when_audio_configuration_fails_in_polling(monkeypatch, tmp_path):
    """
    Testa se o publisher do Instagram executa fallback resiliente quando um container
    com audio_configuration retorna status ERROR da Meta Graph API (código 2207082),
    retentando automaticamente sem o áudio para garantir que o post seja publicado.
    """
    from app.config import settings
    from app.models import PostStatus, PublicationStatus

    publisher = InstagramPublisher()
    monkeypatch.setattr(settings, "INSTAGRAM_ACCESS_TOKEN", "valid_ig_token")
    monkeypatch.setattr(settings, "INSTAGRAM_ACCOUNT_ID", "17841400000000000")
    monkeypatch.setattr(settings, "SIMULATE_PUBLICATIONS", False)
    monkeypatch.setattr(publisher, "_resolve_public_video_url", lambda p: "https://b2.test/video.mp4")
    monkeypatch.setattr(publisher, "_resolve_public_cover_url", lambda p: None)

    post = Post(
        id=77,
        title="Post com Áudio que Falha na Meta",
        video_filename="video.mp4",
        video_path="video.mp4",
        status=PostStatus.SCHEDULED.value,
        scheduled_at=datetime.now(timezone.utc),
        instagram_audio_id="999888777",
        instagram_audio_volume=80,
        instagram_video_volume=50
    )
    pub = PlatformPublication(
        id=77,
        post_id=77,
        platform=PlatformType.INSTAGRAM.value,
        status=PublicationStatus.PENDING.value
    )

    created_containers = []
    class MockMediaResponse:
        status_code = 200
        def __init__(self, cid):
            self.cid = cid
        def json(self):
            return {"id": self.cid}

    class MockPublishResponse:
        status_code = 200
        def json(self):
            return {"id": "ig_final_published_123"}

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, url, **kwargs):
            if "/media_publish" in url:
                return MockPublishResponse()
            elif "/media" in url:
                cid = f"cid_{len(created_containers) + 1}"
                created_containers.append((cid, dict(kwargs.get("params", {}))))
                return MockMediaResponse(cid)
            return MockMediaResponse("cid_0")
        async def get(self, url, **kwargs):
            # O primeiro container (com áudio) falha com ERROR 2207082
            if "cid_1" in url:
                class MockErr:
                    status_code = 200
                    def json(self):
                        return {"status_code": "ERROR", "status": "Error: Media upload has failed with error code 2207082"}
                return MockErr()
            # O segundo container (fallback sem áudio) atinge FINISHED
            class MockOk:
                status_code = 200
                def json(self):
                    return {"status_code": "FINISHED"}
            return MockOk()

    monkeypatch.setattr("httpx.AsyncClient", MockClient)
    async def mock_sleep(s):
        pass
    monkeypatch.setattr("asyncio.sleep", mock_sleep)

    result = await publisher.publish(post, pub)

    assert result.success is True
    assert len(created_containers) == 2
    # Container 1 tinha áudio
    assert "audio_configuration" in created_containers[0][1]
    # Container 2 (fallback) não tem áudio
    assert "audio_configuration" not in created_containers[1][1]
    assert result.external_post_id == "ig_final_published_123"

