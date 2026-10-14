"""
Script de Migração: Criação da tabela invitations e adição do campo whatsapp em users
Viabiliza o sistema de links de convites com tempo de expiração e cadastro seguro.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def run_migration():
    print("Iniciando migração: invitations e whatsapp em users...")
    with engine.connect() as conn:
        # Adiciona whatsapp na tabela users caso não exista
        conn.execute(text("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
        """))

        # Cria tabela invitations
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS invitations (
                id SERIAL PRIMARY KEY,
                token VARCHAR(100) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'editor',
                created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                is_used BOOLEAN NOT NULL DEFAULT FALSE,
                used_by_email VARCHAR(255),
                used_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_invitations_token ON invitations (token);
            CREATE INDEX IF NOT EXISTS ix_invitations_expires_at ON invitations (expires_at);
            CREATE INDEX IF NOT EXISTS ix_invitations_is_used ON invitations (is_used);
        """))
        conn.commit()
    print("Migração invitations e whatsapp concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
