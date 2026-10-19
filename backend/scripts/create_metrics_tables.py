import sys
import os

# Adiciona o diretório do backend ao sys.path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base
from app.models import PostMetricSnapshot
from sqlalchemy import text

def run_migration():
    print("Iniciando migração: criação das tabelas e colunas de métricas...")
    try:
        # 1. Cria a tabela post_metric_snapshots
        Base.metadata.create_all(bind=engine, tables=[PostMetricSnapshot.__table__])
        print("Tabela 'post_metric_snapshots' verificada/criada com sucesso!")

        # 2. Adiciona colunas na tabela platform_publications se não existirem
        with engine.begin() as conn:
            columns_to_add = [
                ("last_views", "INTEGER DEFAULT 0 NOT NULL"),
                ("last_likes", "INTEGER DEFAULT 0 NOT NULL"),
                ("last_comments", "INTEGER DEFAULT 0 NOT NULL"),
                ("last_shares", "INTEGER DEFAULT 0 NOT NULL"),
                ("last_metrics_sync_at", "TIMESTAMP WITH TIME ZONE NULL"),
            ]

            for col_name, col_type in columns_to_add:
                try:
                    conn.execute(text(f"ALTER TABLE platform_publications ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    print(f"Coluna '{col_name}' verificada/adicionada em 'platform_publications'.")
                except Exception as ex:
                    print(f"Aviso ao adicionar coluna {col_name}: {ex}")

        print("Migração de métricas finalizada com 100% de sucesso!")
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
