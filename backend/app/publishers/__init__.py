from typing import Dict
from app.models import PlatformType
from app.publishers.base import BasePublisher, PublicationResult
from app.publishers.instagram import InstagramPublisher
from app.publishers.youtube import YouTubePublisher
from app.publishers.tiktok import TikTokPublisher

_PUBLISHERS: Dict[str, BasePublisher] = {
    PlatformType.INSTAGRAM.value: InstagramPublisher(),
    PlatformType.YOUTUBE.value: YouTubePublisher(),
    PlatformType.TIKTOK.value: TikTokPublisher(),
}

def get_publisher(platform: str) -> BasePublisher:
    normalized = platform.lower()
    if normalized not in _PUBLISHERS:
        raise ValueError(f"Plataforma '{platform}' não suportada.")
    return _PUBLISHERS[normalized]

__all__ = [
    "BasePublisher",
    "PublicationResult",
    "InstagramPublisher",
    "YouTubePublisher",
    "TikTokPublisher",
    "get_publisher",
    "_PUBLISHERS"
]
