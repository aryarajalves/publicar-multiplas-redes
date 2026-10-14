"""
Script de Migração: Criação da tabela social_accounts
Registra credenciais e tokens dinâmicos de contas OAuth (TikTok, YouTube, Instagram).
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine, Base
from app.models import SocialAccount

def run_migration():
    print("Iniciando migração: social_accounts...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS social_accounts (
                id SERIAL PRIMARY KEY,
                platform VARCHAR(50) UNIQUE NOT NULL,
                account_id VARCHAR(255),
                account_name VARCHAR(255),
                avatar_url VARCHAR(500),
                access_token TEXT,
                refresh_token TEXT,
                token_expires_at TIMESTAMPTZ,
                refresh_expires_at TIMESTAMPTZ,
                scopes VARCHAR(500),
                is_connected BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_social_accounts_platform ON social_accounts (platform);
        """))
        conn.commit()
    print("Migração social_accounts concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
