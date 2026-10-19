"""
Script de migração para criar a tabela `instagram_favorite_audios` no banco de dados.
Uso:
    python scripts/add_instagram_favorite_audios_table.py
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.database import engine


def run_migration():
    sql = """
    CREATE TABLE IF NOT EXISTS instagram_favorite_audios (
        id SERIAL PRIMARY KEY,
        audio_id VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        display_artist VARCHAR(255),
        duration_in_ms INTEGER NOT NULL DEFAULT 0,
        audio_type VARCHAR(50) NOT NULL DEFAULT 'music',
        cover_artwork_thumbnail_uri VARCHAR(1000),
        download_url VARCHAR(1000),
        on_platform_audio_preview_link VARCHAR(1000),
        ig_username VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
    with engine.begin() as conn:
        if engine.dialect.name == "sqlite":
            sql = sql.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        conn.execute(text(sql))
    print("[Migração] Tabela 'instagram_favorite_audios' criada/verificada com sucesso!")


if __name__ == "__main__":
    run_migration()
