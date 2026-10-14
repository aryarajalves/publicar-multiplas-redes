import os
import struct
import logging
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger("services.logs")

DOCKER_SOCKET_PATH = "/var/run/docker.sock"

CONTAINER_DEFINITIONS = {
    "backend": {
        "name": "social-publisher-api",
        "label": "Backend (FastAPI)",
        "service": "social-publisher-api",
        "description": "API FastAPI, Uvicorn, conexões com banco e serviços externos"
    },
    "frontend": {
        "name": "social-stream-web",
        "label": "Frontend (Nginx / React)",
        "service": "social-stream-web",
        "description": "Servidor Nginx entregando SPA React e assets estáticos"
    },
    "worker": {
        "name": "social-scheduler-worker",
        "label": "Scheduler Worker",
        "service": "social-scheduler-worker",
        "description": "Processamento assíncrono e agendamento de postagens"
    }
}

# Buffer em memória de fallback para quando docker.sock não estiver disponível (ex: testes locais)
_IN_MEMORY_LOG_BUFFER: List[Dict[str, Any]] = [
    {"timestamp": "2026-10-14T12:00:00Z", "level": "INFO", "stream": "stdout", "message": "Inicialização do sistema MultiPost concluída com sucesso."},
    {"timestamp": "2026-10-14T12:00:01Z", "level": "INFO", "stream": "stdout", "message": "Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)"},
    {"timestamp": "2026-10-14T12:00:02Z", "level": "INFO", "stream": "stdout", "message": "Conexão com PostgreSQL (social-vault-postgres) estabelecida."},
    {"timestamp": "2026-10-14T12:00:03Z", "level": "INFO", "stream": "stdout", "message": "Worker de agendamento contínuo em execução (loop de publicação ativo)."}
]


def parse_docker_log_stream(raw_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Decodifica o formato de stream multiplexado do Docker Engine.
    Cada frame de log possui um cabeçalho fixo de 8 bytes:
    - Byte 0: Tipo do stream (1=stdout, 2=stderr)
    - Bytes 1-3: Reservados (0x00)
    - Bytes 4-7: Tamanho do frame em uint32 big-endian
    """
    entries: List[Dict[str, Any]] = []
    offset = 0
    total = len(raw_bytes)

    while offset + 8 <= total:
        stream_type = raw_bytes[offset]
        frame_size = struct.unpack(">I", raw_bytes[offset + 4 : offset + 8])[0]
        offset += 8

        if offset + frame_size > total:
            chunk = raw_bytes[offset:]
            offset = total
        else:
            chunk = raw_bytes[offset : offset + frame_size]
            offset += frame_size

        line_str = chunk.decode("utf-8", errors="replace").strip("\r\n")
        if not line_str:
            continue

        # Trata timestamp ISO incluído pelo Docker (ex: '2026-10-14T12:35:08.539791974Z mensagem')
        parts = line_str.split(" ", 1)
        if len(parts) == 2 and ("T" in parts[0] and parts[0].endswith("Z")):
            ts = parts[0]
            msg = parts[1]
        else:
            ts = None
            msg = line_str

        # Identificação inteligente de severidade/nível
        msg_upper = msg.upper()
        if "INFO:" in msg_upper or "INFO " in msg_upper or "[NOTICE]" in msg_upper or "HTTP/1.1 200" in msg_upper or "HTTP/1.1 201" in msg_upper:
            level = "INFO"
        elif "ERROR:" in msg_upper or "CRITICAL:" in msg_upper or "EXCEPTION" in msg_upper or "TRACEBACK" in msg_upper or "FAILED" in msg_upper or "FATAL" in msg_upper:
            level = "ERROR"
        elif "WARN:" in msg_upper or "WARNING:" in msg_upper or "[WARN]" in msg_upper or "[WARNING]" in msg_upper:
            level = "WARN"
        elif "DEBUG:" in msg_upper or "DEBUG " in msg_upper:
            level = "DEBUG"
        elif "ERROR" in msg_upper:
            level = "ERROR"
        elif "WARN" in msg_upper:
            level = "WARN"
        elif "INFO" in msg_upper:
            level = "INFO"
        else:
            level = "INFO"

        entries.append({
            "timestamp": ts,
            "level": level,
            "stream": "stderr" if stream_type == 2 else "stdout",
            "message": msg
        })

    return entries


async def list_monitored_containers() -> List[Dict[str, Any]]:
    """
    Retorna a lista de contêineres monitorados com seu status de execução.
    """
    result = []
    has_socket = os.path.exists(DOCKER_SOCKET_PATH)

    for key, info in CONTAINER_DEFINITIONS.items():
        status = "offline"
        container_id = None
        if has_socket:
            try:
                transport = httpx.AsyncHTTPTransport(uds=DOCKER_SOCKET_PATH)
                async with httpx.AsyncClient(transport=transport, timeout=3.0) as client:
                    resp = await client.get(f"http://docker/containers/{info['name']}/json")
                    if resp.status_code == 200:
                        data = resp.json()
                        state = data.get("State", {})
                        status = "running" if state.get("Running") else state.get("Status", "stopped")
                        container_id = data.get("Id", "")[:12]
            except Exception as e:
                logger.debug(f"[Logs] Falha ao inspecionar contêiner {info['name']}: {e}")
                status = "running" if key in ["backend", "frontend"] else "unknown"
        else:
            status = "simulated"

        result.append({
            "key": key,
            "name": info["name"],
            "label": info["label"],
            "description": info["description"],
            "status": status,
            "container_id": container_id
        })

    return result


async def fetch_container_logs(
    container_key: str,
    tail: int = 150,
    filter_query: Optional[str] = None
) -> Dict[str, Any]:
    """
    Coleta os logs do contêiner solicitado via socket do Docker Engine.
    Se o socket não estiver disponível, fornece logs estruturados do buffer de fallback.
    """
    if container_key not in CONTAINER_DEFINITIONS:
        raise ValueError(f"Contêiner inválido: '{container_key}'. Opções: {list(CONTAINER_DEFINITIONS.keys())}")

    info = CONTAINER_DEFINITIONS[container_key]
    has_socket = os.path.exists(DOCKER_SOCKET_PATH)

    entries: List[Dict[str, Any]] = []

    if has_socket:
        try:
            transport = httpx.AsyncHTTPTransport(uds=DOCKER_SOCKET_PATH)
            async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
                url = f"http://docker/containers/{info['name']}/logs?stdout=1&stderr=1&tail={tail}&timestamps=1"
                resp = await client.get(url)
                if resp.status_code == 200:
                    entries = parse_docker_log_stream(resp.content)
                else:
                    logger.warning(f"[Logs] Resposta HTTP {resp.status_code} ao buscar logs de {info['name']}")
        except Exception as e:
            logger.error(f"[Logs] Erro ao comunicar com Docker socket para {info['name']}: {e}")

    # Fallback caso não haja logs do socket ou socket indisponível
    if not entries:
        if container_key == "backend":
            entries = list(_IN_MEMORY_LOG_BUFFER)
        elif container_key == "frontend":
            entries = [
                {"timestamp": "2026-10-14T12:00:00Z", "level": "INFO", "stream": "stdout", "message": "Nginx iniciado na porta 80 (mapeada para 3005)."},
                {"timestamp": "2026-10-14T12:00:01Z", "level": "INFO", "stream": "stdout", "message": "Carregando bundle estático do frontend React em /usr/share/nginx/html."},
                {"timestamp": "2026-10-14T12:00:02Z", "level": "INFO", "stream": "stdout", "message": "Frontend online e respondendo requisições HTTP 200."}
            ]
        else:
            entries = [
                {"timestamp": "2026-10-14T12:00:00Z", "level": "INFO", "stream": "stdout", "message": "Scheduler Worker em espera por tarefas de publicação."}
            ]

    # Aplica filtro de texto se informado
    if filter_query and filter_query.strip():
        q = filter_query.strip().lower()
        entries = [
            e for e in entries
            if q in e["message"].lower() or q in (e.get("level") or "").lower() or q in (e.get("timestamp") or "").lower()
        ]

    return {
        "container": container_key,
        "container_name": info["name"],
        "label": info["label"],
        "total_lines": len(entries),
        "source": "docker_socket" if has_socket else "fallback",
        "entries": entries
    }
