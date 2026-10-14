import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.backup_service import BackupService
from app.schemas import (
    BackupRecordRead,
    BackupListResponse,
    BackupScheduleRead,
    BackupScheduleUpdate,
    BackupStatusCardsResponse,
    BackupActionResponse,
)

logger = logging.getLogger("backup_api")
router = APIRouter(prefix="/backup", tags=["Backup Automático"])


@router.get("/status", response_model=BackupStatusCardsResponse)
def get_backup_status(db: Session = Depends(get_db)):
    """
    Retorna métricas consolidadas para os 4 cards da interface:
    - Último Backup (data/hora BRT e nome)
    - Próximo Backup previsto
    - Retenção no S3 / B2 (total / limite)
    - Conectividade com Backblaze B2
    """
    service = BackupService(db)
    data = service.get_status_cards_data()
    return BackupStatusCardsResponse(**data)


@router.get("/list", response_model=BackupListResponse)
def list_backups(
    backup_type: Optional[str] = Query(None, description="Filtro por tipo: all, automatic, manual, imported"),
    db: Session = Depends(get_db)
):
    """
    Lista todos os backups registrados no sistema com filtro por tipo.
    """
    service = BackupService(db)
    backups = service.list_backups(backup_type)
    total_size = sum(b.file_size_bytes for b in backups)
    return BackupListResponse(
        backups=backups,
        total=len(backups),
        total_size_bytes=total_size
    )


@router.post("/create", response_model=BackupActionResponse)
def trigger_manual_backup(db: Session = Depends(get_db)):
    """
    Dispara um backup manual imediato do banco de dados PostgreSQL.
    """
    try:
        service = BackupService(db)
        record = service.create_backup(backup_type="manual")
        return BackupActionResponse(
            success=True,
            message="Backup manual concluído com sucesso e sincronizado no armazenamento.",
            backup=record
        )
    except Exception as e:
        logger.error(f"Erro ao disparar backup manual: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao gerar backup manual: {str(e)}"
        )


@router.get("/schedule", response_model=BackupScheduleRead)
def get_schedule(db: Session = Depends(get_db)):
    """
    Retorna as preferências configuradas de agendamento automático e retenção.
    """
    service = BackupService(db)
    settings_record = service.get_or_create_schedule_settings()
    return settings_record


@router.post("/schedule", response_model=BackupScheduleRead)
def update_schedule(payload: BackupScheduleUpdate, db: Session = Depends(get_db)):
    """
    Atualiza as preferências de agendamento periódico e retenção de backups.
    """
    service = BackupService(db)
    updated = service.update_schedule_settings(payload)
    return updated


@router.post("/import", response_model=BackupActionResponse)
async def import_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Importa um dump externo (.dump, .dump.gz, .sql) e o registra no sistema.
    """
    allowed_extensions = (".dump", ".dump.gz", ".gz", ".sql")
    filename = file.filename or "uploaded_backup.dump"
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Formatos aceitos: .dump, .dump.gz, .gz, .sql"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo enviado está vazio."
        )

    try:
        service = BackupService(db)
        record = service.import_external_backup(filename, content)
        return BackupActionResponse(
            success=True,
            message=f"Arquivo '{filename}' importado com sucesso!",
            backup=record
        )
    except Exception as e:
        logger.error(f"Erro ao importar backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao processar arquivo importado: {str(e)}"
        )


@router.get("/download/{backup_id}")
def download_backup(backup_id: int, db: Session = Depends(get_db)):
    """
    Permite o download do arquivo de backup gerado.
    """
    service = BackupService(db)
    record = service.get_backup_by_id(backup_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup não encontrado.")

    local_path = record.local_path
    if not local_path or not os.path.exists(local_path):
        candidate = service.backup_dir / record.filename
        if candidate.exists():
            local_path = str(candidate)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Arquivo físico de backup não encontrado no servidor."
            )

    return FileResponse(
        path=local_path,
        filename=record.filename,
        media_type="application/gzip"
    )


@router.post("/restore/{backup_id}", response_model=BackupActionResponse)
def restore_backup(backup_id: int, db: Session = Depends(get_db)):
    """
    Restaura o banco de dados a partir do dump indicado.
    """
    service = BackupService(db)
    success, message = service.restore_backup(backup_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return BackupActionResponse(success=True, message=message)


@router.delete("/{backup_id}", response_model=BackupActionResponse)
def delete_backup(backup_id: int, db: Session = Depends(get_db)):
    """
    Exclui um backup do banco de dados, da nuvem Backblaze B2 e do armazenamento local.
    """
    service = BackupService(db)
    success = service.delete_backup(backup_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup não encontrado.")
    return BackupActionResponse(success=True, message="Backup excluído com sucesso.")
