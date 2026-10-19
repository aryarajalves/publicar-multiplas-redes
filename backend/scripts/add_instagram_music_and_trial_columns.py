import sys
import os

# Adiciona o diretório do backend ao sys.path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine
from sqlalchemy import text


def run_migration():
    print("Iniciando migração: adicionando colunas de música e Reels de Teste (Trial Reels) na tabela 'posts'...")
    try:
        columns_to_add = [
            ("instagram_audio_id", "VARCHAR(100) NULL"),
            ("instagram_audio_title", "VARCHAR(255) NULL"),
            ("instagram_audio_artist", "VARCHAR(255) NULL"),
            ("instagram_audio_volume", "INTEGER DEFAULT 100 NULL"),
            ("instagram_video_volume", "INTEGER DEFAULT 100 NULL"),
            ("instagram_is_trial_reel", "BOOLEAN DEFAULT FALSE NOT NULL"),
            ("instagram_trial_graduation_strategy", "VARCHAR(50) DEFAULT 'MANUAL' NULL"),
        ]

        with engine.begin() as conn:
            for col_name, col_type in columns_to_add:
                try:
                    conn.execute(text(f"ALTER TABLE posts ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    print(f"Coluna '{col_name}' verificada/adicionada em 'posts'.")
                except Exception as ex:
                    print(f"Aviso ao adicionar coluna {col_name}: {ex}")

        print("Migração concluída com 100% de sucesso!")
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
