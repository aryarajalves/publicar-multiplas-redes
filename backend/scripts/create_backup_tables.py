import sys
import os

# Adiciona o diretório do backend ao sys.path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base
from app.models import BackupRecord, BackupScheduleSetting
from sqlalchemy import text

def create_tables():
    print("Iniciando migração: criação das tabelas de backup...")
    try:
        # Cria as tabelas utilizando os metadados do SQLAlchemy
        Base.metadata.create_all(bind=engine, tables=[BackupRecord.__table__, BackupScheduleSetting.__table__])
        print("Tabelas 'backup_records' e 'backup_schedule_settings' criadas com sucesso!")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_tables()
