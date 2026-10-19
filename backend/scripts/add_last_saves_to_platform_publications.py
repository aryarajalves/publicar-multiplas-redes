"""
Script de migração para adicionar a coluna `last_saves` na tabela `platform_publications`.
Uso:
    python scripts/add_last_saves_to_platform_publications.py
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.database import engine


def run_migration():
    sql = """
    ALTER TABLE platform_publications 
    ADD COLUMN IF NOT EXISTS last_saves INTEGER NOT NULL DEFAULT 0;
    """
    with engine.begin() as conn:
        conn.execute(text(sql))
    print("[Migração] Coluna 'last_saves' adicionada com sucesso em 'platform_publications'!")


if __name__ == "__main__":
    run_migration()
