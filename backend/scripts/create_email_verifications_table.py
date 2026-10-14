"""
Script de Migração: Criação da tabela email_verifications
Viabiliza o envio e validação de códigos OTP de 6 dígitos via Brevo para cadastro de convidados.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def run_migration():
    print("Iniciando migração: criação da tabela email_verifications...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(10) NOT NULL,
                token VARCHAR(100) NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                verified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_email_verifications_email ON email_verifications (email);
            CREATE INDEX IF NOT EXISTS ix_email_verifications_code ON email_verifications (code);
            CREATE INDEX IF NOT EXISTS ix_email_verifications_token ON email_verifications (token);
            CREATE INDEX IF NOT EXISTS ix_email_verifications_expires_at ON email_verifications (expires_at);
        """))
        conn.commit()
    print("Migração email_verifications concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
