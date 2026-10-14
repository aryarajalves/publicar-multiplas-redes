import os
import shutil
from pathlib import Path

# Configura banco de dados em memória/sqlite para os testes antes de importar o app
TEST_DATABASE_URL = "sqlite://"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["SIMULATE_PUBLICATIONS"] = "true"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.config import settings
from app.database import Base, get_db
from app.main import app

# Garante que durante os testes a simulação está ligada
settings.SIMULATE_PUBLICATIONS = True
TEST_UPLOAD_DIR = "test_uploads"
settings.UPLOAD_DIR = TEST_UPLOAD_DIR

# Usa SQLite in-memory com StaticPool para testes unitários 100% isolados, sem locks em disco
TEST_DATABASE_URL = "sqlite://"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Cria diretório temporário para uploads de teste
    Path(TEST_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    (Path(TEST_UPLOAD_DIR) / "thumbnails").mkdir(parents=True, exist_ok=True)
    yield
    # Limpa arquivos após execução de todos os testes
    if os.path.exists(TEST_UPLOAD_DIR):
        shutil.rmtree(TEST_UPLOAD_DIR, ignore_errors=True)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    from app.api.auth import init_super_admin
    init_super_admin(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
