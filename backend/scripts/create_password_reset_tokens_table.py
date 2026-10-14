"""
Script de Migração: Criação da tabela password_reset_tokens
Armazena tokens seguros de redefinição de senha enviados aos usuários via Brevo.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def run_migration():
    print("Iniciando migração: criação da tabela password_reset_tokens...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(100) NOT NULL UNIQUE,
                expires_at TIMESTAMPTZ NOT NULL,
                is_used BOOLEAN NOT NULL DEFAULT FALSE,
                used_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);
            CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token ON password_reset_tokens (token);
            CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);
            CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_is_used ON password_reset_tokens (is_used);
        """))
        conn.commit()
    print("Migração password_reset_tokens concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
