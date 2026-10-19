from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MultiPost"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://postgres:postgres@social-vault-postgres:5432/social_publisher_db"
    )
    
    # Media Storage (diretório fixo mapeado automaticamente pelo volume)
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads" if os.path.exists("/app/uploads") else "uploads")
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_EXTENSIONS: List[str] = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    
    # Social Simulation Mode (padrão desativado / false)
    SIMULATE_PUBLICATIONS: bool = os.getenv("SIMULATE_PUBLICATIONS", "false").lower() in ("true", "1", "t")
    
    # Instagram Credentials (Meta Graph API)
    INSTAGRAM_ACCESS_TOKEN: str = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    INSTAGRAM_ACCOUNT_ID: str = os.getenv("INSTAGRAM_ACCOUNT_ID", "")
    
    # YouTube Credentials (Data API v3)
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    YOUTUBE_CLIENT_ID: str = os.getenv("YOUTUBE_CLIENT_ID", "")
    YOUTUBE_CLIENT_SECRET: str = os.getenv("YOUTUBE_CLIENT_SECRET", "")
    YOUTUBE_REFRESH_TOKEN: str = os.getenv("YOUTUBE_REFRESH_TOKEN", "")
    
    # TikTok Credentials (Content Posting API)
    TIKTOK_CLIENT_KEY: str = os.getenv("TIKTOK_CLIENT_KEY", "")
    TIKTOK_CLIENT_SECRET: str = os.getenv("TIKTOK_CLIENT_SECRET", "")
    TIKTOK_ACCESS_TOKEN: str = os.getenv("TIKTOK_ACCESS_TOKEN", "")
    TIKTOK_REDIRECT_URI: str = os.getenv("TIKTOK_REDIRECT_URI", "http://localhost:7800/api/auth/tiktok/callback")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:7300")

    # OpenAI (LLM & Whisper Transcription)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Super Admin Inicial (Provisionamento Automático via .env)
    SUPER_ADMIN_NAME: str = os.getenv("SUPER_ADMIN_NAME", "Super Admin")
    SUPER_ADMIN_EMAIL: str = os.getenv("SUPER_ADMIN_EMAIL", "admin@multipost.com")
    SUPER_ADMIN_PASSWORD: str = os.getenv("SUPER_ADMIN_PASSWORD", "admin123")

    # Brevo (Sendinblue) - Envio de E-mails Transacionais com Códigos OTP
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_SENDER_EMAIL: str = os.getenv("BREVO_SENDER_EMAIL", "contato@multipost.com")
    BREVO_SENDER_NAME: str = os.getenv("BREVO_SENDER_NAME", "MultiPost")

    # Backblaze B2 / S3 Storage (Backup Automático)
    B2_APPLICATION_KEY_ID: str = os.getenv("B2_APPLICATION_KEY_ID", "")
    B2_APPLICATION_KEY: str = os.getenv("B2_APPLICATION_KEY", "")
    B2_BUCKET_NAME: str = os.getenv("B2_BUCKET_NAME", "multipost-backups")
    B2_ENDPOINT_URL: str = os.getenv("B2_ENDPOINT_URL", "https://s3.us-east-005.backblazeb2.com")
    B2_REGION_NAME: str = os.getenv("B2_REGION_NAME", "us-east-005")
    POSTGRES_CONTAINER_NAME: str = os.getenv("POSTGRES_CONTAINER_NAME", "social-vault-postgres")

    # CORS

    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
