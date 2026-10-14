from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from app.models import Post, PlatformPublication

@dataclass
class PublicationResult:
    success: bool
    external_post_id: Optional[str] = None
    post_url: Optional[str] = None
    error_message: Optional[str] = None

class BasePublisher(ABC):
    platform_name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if required credentials are present."""
        pass

    @abstractmethod
    async def publish(self, post: Post, publication: PlatformPublication) -> PublicationResult:
        """Executes the publication of a video post to the specific social media platform."""
        pass
