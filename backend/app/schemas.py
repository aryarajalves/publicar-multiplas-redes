from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models import PostStatus, PlatformType, PublicationStatus

class PlatformPublicationBase(BaseModel):
    platform: PlatformType
    status: PublicationStatus = PublicationStatus.PENDING
    published_at: Optional[datetime] = None
    external_post_id: Optional[str] = None
    post_url: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0

class PlatformPublicationRead(PlatformPublicationBase):
    id: int
    post_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    caption: Optional[str] = None
    scheduled_at: datetime

class PostCreate(PostBase):
    platforms: List[PlatformType] = [PlatformType.INSTAGRAM]
    transcription: Optional[str] = None
    instagram_caption: Optional[str] = None
    instagram_hashtags: Optional[str] = None
    youtube_title: Optional[str] = None
    youtube_description: Optional[str] = None
    youtube_tags: Optional[str] = Field(None, max_length=500)
    youtube_video_type: Optional[str] = "shorts"
    youtube_related_video: Optional[str] = Field(None, max_length=500)
    tiktok_caption: Optional[str] = None
    tiktok_hashtags: Optional[str] = None
    thumbnail_path: Optional[str] = None
    youtube_thumbnail_path: Optional[str] = None

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    caption: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    platforms: Optional[List[PlatformType]] = None
    thumbnail_path: Optional[str] = None
    youtube_thumbnail_path: Optional[str] = None
    transcription: Optional[str] = None
    instagram_caption: Optional[str] = None
    instagram_hashtags: Optional[str] = None
    youtube_title: Optional[str] = None
    youtube_description: Optional[str] = None
    youtube_tags: Optional[str] = Field(None, max_length=500)
    youtube_video_type: Optional[str] = None
    youtube_related_video: Optional[str] = Field(None, max_length=500)
    tiktok_caption: Optional[str] = None
    tiktok_hashtags: Optional[str] = None

class PostRead(BaseModel):
    id: int
    title: str
    caption: Optional[str] = None
    video_filename: str
    video_path: str
    thumbnail_path: Optional[str] = None
    youtube_thumbnail_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None
    status: str
    scheduled_at: datetime
    created_at: datetime
    updated_at: datetime
    publications: List[PlatformPublicationRead] = []

    # AI & Plataforma campos
    transcription: Optional[str] = None
    instagram_caption: Optional[str] = None
    instagram_hashtags: Optional[str] = None
    youtube_title: Optional[str] = None
    youtube_description: Optional[str] = None
    youtube_tags: Optional[str] = None
    youtube_video_type: Optional[str] = "shorts"
    youtube_related_video: Optional[str] = None
    tiktok_caption: Optional[str] = None
    tiktok_hashtags: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PostListResponse(BaseModel):
    total: int
    items: List[PostRead]

class PlatformStatusItem(BaseModel):
    platform: PlatformType
    configured: bool
    total_published: int
    total_pending: int
    total_failed: int

class PlatformOverviewResponse(BaseModel):
    total_posts: int
    total_scheduled: int
    total_published: int
    total_failed: int
    platforms: List[PlatformStatusItem]

class ActionResponse(BaseModel):
    success: bool
    message: str
    post: Optional[PostRead] = None

class YouTubeVideoOptionRead(BaseModel):
    post_id: int
    title: str
    youtube_id: Optional[str] = None
    url: str
    type: str = "video"
    status: str
    thumbnail: Optional[str] = None
    created_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    duration_formatted: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Schemas de IA
class InstagramAISchema(BaseModel):
    caption: str
    hashtags: List[str] = Field(default_factory=list)

class YouTubeAISchema(BaseModel):
    title: str
    title_options: List[str] = Field(default_factory=list, description="Lista com 3 sugestões de títulos magnéticos para escolha")
    description: str
    tags: List[str] = Field(default_factory=list)
    video_type: str = "Shorts"

class TikTokAISchema(BaseModel):
    caption: str
    hashtags: List[str] = Field(default_factory=list)

class AIGenerationResponse(BaseModel):
    transcription: str
    instagram: InstagramAISchema
    youtube: YouTubeAISchema
    tiktok: TikTokAISchema

class ThumbnailGenerateResponse(BaseModel):
    thumbnail_url: str
    thumbnail_path: str
    format: str
    prompt_used: str


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=5, max_length=255)
    whatsapp: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "admin"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    whatsapp: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=100)


class LoginResponse(BaseModel):
    success: bool
    user: UserRead
    message: str


class InvitationCreate(BaseModel):
    role: str = Field(default="editor", description="Tipo de usuário: admin ou editor")
    expires_in_hours: int = Field(default=24, description="Validade em horas: 1, 24, 72, 168")


class InvitationRead(BaseModel):
    id: int
    token: str
    role: str
    expires_at: datetime
    is_used: bool
    used_by_email: Optional[str] = None
    used_at: Optional[datetime] = None
    created_at: datetime
    invite_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InvitationValidateResponse(BaseModel):
    valid: bool
    role: str
    expires_at: datetime
    message: Optional[str] = None
    email_service_configured: bool = False


class SendVerificationCodeRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)


class SendVerificationCodeResponse(BaseModel):
    success: bool
    message: str
    email: str


class RegisterByInviteRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=5, max_length=255)
    whatsapp: str = Field(..., min_length=8, max_length=50)
    password: str = Field(..., max_length=100)
    verification_code: str = Field(..., min_length=6, max_length=10)


class ResetPasswordConfirmRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=150)
    new_password: str = Field(..., min_length=12, max_length=100)


# ==========================================
# ESQUEMAS DE BACKUP AUTOMÁTICO & S3/B2
# ==========================================

class BackupRecordRead(BaseModel):
    id: int
    filename: str
    file_size_bytes: int
    backup_type: str  # automatic, manual, imported
    s3_key: Optional[str] = None
    status: str = "completed"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BackupListResponse(BaseModel):
    backups: List[BackupRecordRead]
    total: int
    total_size_bytes: int


class BackupScheduleRead(BaseModel):
    is_active: bool
    frequency_hours: int
    s3_folder: str
    retention_limit: int
    last_backup_at: Optional[datetime] = None
    next_backup_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BackupScheduleUpdate(BaseModel):
    is_active: bool = True
    frequency_hours: int = Field(default=24, ge=1, le=168)
    s3_folder: str = Field(default="multipost/backups/")
    retention_limit: int = Field(default=30, ge=1, le=500)


class BackupStatusCardsResponse(BaseModel):
    last_backup: Optional[BackupRecordRead] = None
    next_backup_at: Optional[datetime] = None
    frequency_hours: int = 24
    is_active: bool = True
    total_backups: int = 0
    retention_limit: int = 30
    total_size_bytes: int = 0
    s3_connected: bool = False
    bucket_name: Optional[str] = None
    provider: str = "Backblaze B2"


class BackupActionResponse(BaseModel):
    success: bool
    message: str
    backup: Optional[BackupRecordRead] = None



