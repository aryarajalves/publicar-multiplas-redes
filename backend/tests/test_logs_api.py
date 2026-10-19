import struct
import pytest
from app.services.log_service import parse_docker_log_stream, CONTAINER_DEFINITIONS


def test_parse_docker_log_stream():
    # Cria payload com cabeçalho de 8 bytes padrão Docker:
    # Frame 1: stdout (1), tamanho 41
    msg1 = b"2026-10-14T12:00:00Z INFO: Server running\n"
    header1 = struct.pack(">BxxxI", 1, len(msg1))

    # Frame 2: stderr (2), tamanho 39
    msg2 = b"2026-10-14T12:00:01Z ERROR: DB timeout\n"
    header2 = struct.pack(">BxxxI", 2, len(msg2))

    # Frame 3: stderr (2), mensagem informativa do Uvicorn
    msg3 = b"2026-10-14T12:00:02Z INFO: Uvicorn running on http://0.0.0.0:8000\n"
    header3 = struct.pack(">BxxxI", 2, len(msg3))

    raw_stream = header1 + msg1 + header2 + msg2 + header3 + msg3
    entries = parse_docker_log_stream(raw_stream)

    assert len(entries) == 3
    assert entries[0]["stream"] == "stdout"
    assert entries[0]["level"] == "INFO"
    assert "Server running" in entries[0]["message"]
    assert entries[0]["timestamp"] == "2026-10-14T12:00:00Z"

    assert entries[1]["stream"] == "stderr"
    assert entries[1]["level"] == "ERROR"
    assert "DB timeout" in entries[1]["message"]

    assert entries[2]["stream"] == "stderr"
    assert entries[2]["level"] == "INFO"
    assert "Uvicorn running" in entries[2]["message"]


def test_get_containers_endpoint(client):
    response = client.get("/api/logs/containers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    keys = [item["key"] for item in data]
    assert "backend" in keys
    assert "frontend" in keys


def test_get_backend_logs_endpoint(client):
    response = client.get("/api/logs/?container=backend&tail=50")
    assert response.status_code == 200
    data = response.json()
    assert data["container"] == "backend"
    assert "entries" in data
    assert isinstance(data["entries"], list)
    assert data["total_lines"] >= 1


def test_get_frontend_logs_endpoint(client):
    response = client.get("/api/logs/?container=frontend&tail=50")
    assert response.status_code == 200
    data = response.json()
    assert data["container"] == "frontend"
    assert "entries" in data
    assert isinstance(data["entries"], list)


def test_invalid_container_logs(client):
    response = client.get("/api/logs/?container=unknown_service")
    assert response.status_code == 400
    assert "Contêiner inválido" in response.json()["detail"]


def test_logs_filter_query(client):
    response = client.get("/api/logs/?container=backend&filter=MultiPost")
    assert response.status_code == 200
    data = response.json()
    assert "entries" in data
    # Todas as entradas retornadas devem conter o filtro (se houver correspondência)
    for entry in data["entries"]:
        assert "multipost" in entry["message"].lower() or "multipost" in str(entry).lower()


@pytest.mark.asyncio
async def test_default_ports_and_frontend_fallback_log(monkeypatch):
    from app.services import log_service
    from app.config import Settings

    # Simula ausência do socket Docker para validar o fallback do frontend na porta 7300
    monkeypatch.setattr(log_service.os.path, "exists", lambda p: False)
    result = await log_service.fetch_container_logs("frontend", tail=10)
    assert result["source"] == "fallback"
    messages = " ".join(e["message"] for e in result["entries"])
    assert "7300" in messages

    # Valida que os padrões de Settings apontam para 7800 (Backend) e 7300 (Frontend)
    monkeypatch.delenv("TIKTOK_REDIRECT_URI", raising=False)
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    s = Settings(_env_file=None)
    assert "7800" in s.TIKTOK_REDIRECT_URI
    assert "7300" in s.FRONTEND_URL

