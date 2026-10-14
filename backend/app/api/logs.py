import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.log_service import (
    list_monitored_containers,
    fetch_container_logs,
    CONTAINER_DEFINITIONS
)

logger = logging.getLogger("api.logs")

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/containers")
async def get_containers():
    """
    Lista todos os contêineres disponíveis para monitoramento de logs
    (Backend, Frontend e Worker) com seu status atual.
    """
    try:
        containers = await list_monitored_containers()
        return containers
    except Exception as e:
        logger.error(f"[Logs API] Erro ao listar contêineres: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao inspecionar contêineres do sistema.")


@router.get("/")
async def get_logs(
    container: str = Query("backend", description="Identificador do contêiner (backend, frontend ou worker)"),
    tail: int = Query(150, ge=10, le=1000, description="Quantidade de linhas recentes a retornar"),
    filter: Optional[str] = Query(None, description="Termo para filtrar logs textualmente")
):
    """
    Obtém os logs mais recentes de um contêiner específico em tempo real.
    Permite filtrar por quantidade de linhas e termo de busca.
    """
    if container not in CONTAINER_DEFINITIONS:
        valid_keys = ", ".join(CONTAINER_DEFINITIONS.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Contêiner inválido: '{container}'. Os contêineres válidos são: {valid_keys}."
        )

    try:
        data = await fetch_container_logs(
            container_key=container,
            tail=tail,
            filter_query=filter
        )
        return data
    except Exception as e:
        logger.error(f"[Logs API] Erro ao coletar logs do contêiner '{container}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao recuperar logs do contêiner: {str(e)}")
