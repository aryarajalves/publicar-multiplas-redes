import sys
import os

# Adiciona o diretório do backend ao sys.path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base
from app.models import PublicationSetting

def create_tables():
    print("Iniciando migração: criação da tabela publication_settings...")
    try:
        # Cria a tabela utilizando os metadados do SQLAlchemy
        Base.metadata.create_all(bind=engine, tables=[PublicationSetting.__table__])
        print("Tabela 'publication_settings' criada com sucesso!")
    except Exception as e:
        print(f"Erro ao criar tabela: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_tables()
