import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, Float, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PlatformType(str, enum.Enum):
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"

class PublicationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PUBLISHED = "published"
    FAILED = "failed"
    SKIPPED = "skipped"

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    caption = Column(Text, nullable=True)
    video_filename = Column(String(255), nullable=False)
    video_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500), nullable=True)
    youtube_thumbnail_path = Column(String(500), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    status = Column(String(50), default=PostStatus.SCHEDULED.value, nullable=False, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Conteúdo personalizado por IA / plataforma
    transcription = Column(Text, nullable=True)
    instagram_caption = Column(Text, nullable=True)
    instagram_hashtags = Column(String(500), nullable=True)
    instagram_audio_id = Column(String(100), nullable=True)
    instagram_audio_title = Column(String(255), nullable=True)
    instagram_audio_artist = Column(String(255), nullable=True)
    instagram_audio_volume = Column(Integer, nullable=True, default=100)
    instagram_video_volume = Column(Integer, nullable=True, default=100)
    instagram_is_trial_reel = Column(Boolean, nullable=False, default=False)
    instagram_trial_graduation_strategy = Column(String(50), nullable=True, default="MANUAL")
    youtube_title = Column(String(255), nullable=True)
    youtube_description = Column(Text, nullable=True)
    youtube_tags = Column(String(500), nullable=True)
    youtube_video_type = Column(String(50), nullable=True, default="shorts")
    youtube_related_video = Column(String(500), nullable=True)
    tiktok_caption = Column(Text, nullable=True)
    tiktok_hashtags = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    publications = relationship(
        "PlatformPublication",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PlatformPublication.id"
    )

    @property
    def total_views(self) -> int:
        return sum(p.last_views or 0 for p in self.publications)

    @property
    def total_likes(self) -> int:
        return sum(p.last_likes or 0 for p in self.publications)

    @property
    def total_comments(self) -> int:
        return sum(p.last_comments or 0 for p in self.publications)

    @property
    def total_shares(self) -> int:
        return sum(p.last_shares or 0 for p in self.publications)

    @property
    def total_saves(self) -> int:
        return sum(getattr(p, 'last_saves', 0) or 0 for p in self.publications)

class PlatformPublication(Base):
    __tablename__ = "platform_publications"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default=PublicationStatus.PENDING.value, nullable=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    external_post_id = Column(String(255), nullable=True)
    post_url = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    last_views = Column(Integer, default=0, nullable=False)
    last_likes = Column(Integer, default=0, nullable=False)
    last_comments = Column(Integer, default=0, nullable=False)
    last_shares = Column(Integer, default=0, nullable=False)
    last_saves = Column(Integer, default=0, nullable=False)
    last_metrics_sync_at = Column(DateTime(timezone=True), nullable=True)

    post = relationship("Post", back_populates="publications")
    metric_snapshots = relationship(
        "PostMetricSnapshot",
        back_populates="publication",
        cascade="all, delete-orphan",
        order_by="PostMetricSnapshot.id.desc()"
    )


class PostMetricSnapshot(Base):
    __tablename__ = "post_metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    publication_id = Column(Integer, ForeignKey("platform_publications.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)
    views = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    comments = Column(Integer, default=0, nullable=False)
    shares = Column(Integer, default=0, nullable=False)
    saves = Column(Integer, default=0, nullable=False)
    reach = Column(Integer, default=0, nullable=False)
    impressions = Column(Integer, default=0, nullable=False)
    watch_time_seconds = Column(Float, default=0.0, nullable=False)
    retention_rate_pct = Column(Float, default=0.0, nullable=False)
    ctr_pct = Column(Float, default=0.0, nullable=False)
    collected_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    publication = relationship("PlatformPublication", back_populates="metric_snapshots")


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), unique=True, nullable=False, index=True)
    account_id = Column(String(255), nullable=True)
    account_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    refresh_expires_at = Column(DateTime(timezone=True), nullable=True)
    scopes = Column(String(500), nullable=True)
    is_connected = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    whatsapp = Column(String(50), nullable=True)
    hashed_password = Column(String(500), nullable=False)
    role = Column(String(50), default=UserRole.ADMIN.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(50), default=UserRole.EDITOR.value, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False, index=True)
    used_by_email = Column(String(255), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False, index=True)
    token = Column(String(100), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id])


class BackupRecord(Base):
    __tablename__ = "backup_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False, unique=True, index=True)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    backup_type = Column(String(50), default="manual", nullable=False, index=True)  # automatic, manual, imported
    s3_key = Column(String(500), nullable=True)
    local_path = Column(String(500), nullable=True)
    status = Column(String(50), default="completed", nullable=False)  # completed, failed, in_progress
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


class BackupScheduleSetting(Base):
    __tablename__ = "backup_schedule_settings"

    id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    frequency_hours = Column(Integer, default=24, nullable=False)
    s3_folder = Column(String(255), default="multipost/backups/", nullable=False)
    retention_limit = Column(Integer, default=30, nullable=False)
    last_backup_at = Column(DateTime(timezone=True), nullable=True)
    next_backup_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class PublicationSetting(Base):
    __tablename__ = "publication_settings"

    id = Column(Integer, primary_key=True, index=True)
    default_location_name = Column(String(255), nullable=True)
    default_location_id = Column(String(100), nullable=True)
    tiktok_location_hashtags = Column(String(500), nullable=True)
    youtube_location_name = Column(String(255), nullable=True)
    apply_location_to_all = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class InstagramFavoriteAudio(Base):
    __tablename__ = "instagram_favorite_audios"

    id = Column(Integer, primary_key=True, index=True)
    audio_id = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    display_artist = Column(String(255), nullable=True)
    duration_in_ms = Column(Integer, default=0, nullable=False)
    audio_type = Column(String(50), default="music", nullable=False)
    cover_artwork_thumbnail_uri = Column(String(1000), nullable=True)
    download_url = Column(String(1000), nullable=True)
    on_platform_audio_preview_link = Column(String(1000), nullable=True)
    ig_username = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

