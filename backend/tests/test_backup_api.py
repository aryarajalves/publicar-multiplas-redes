import io
from datetime import datetime, timezone
from app.models import BackupRecord, BackupScheduleSetting
from app.services.backup_service import BackupService


def test_get_backup_status_default(client, db_session):
    res = client.get("/api/backup/status")
    assert res.status_code == 200
    data = res.json()
    assert "last_backup" in data
    assert "frequency_hours" in data
    assert "total_backups" in data
    assert data["total_backups"] == 0
    assert data["provider"] == "Backblaze B2"
    assert "s3_connected" in data


def test_create_manual_backup(client, db_session):
    res = client.post("/api/backup/create")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    backup = body["backup"]
    assert backup is not None
    assert backup["filename"].startswith("multipost_backup_")
    assert backup["filename"].endswith(".dump.gz")
    assert backup["backup_type"] == "manual"
    assert backup["file_size_bytes"] > 0
    assert backup["status"] == "completed"

    # Confirma que status agora reflete o último backup
    status_res = client.get("/api/backup/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["total_backups"] >= 1
    assert status_data["last_backup"]["id"] == backup["id"]


def test_list_backups_with_type_filter(client, db_session):
    service = BackupService(db_session)
    service.create_backup(backup_type="manual")
    service.create_backup(backup_type="automatic")
    service.import_external_backup("external_test.sql", b"CREATE TABLE dummy();")

    # Lista todos
    res_all = client.get("/api/backup/list")
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["total"] == 3
    assert len(data_all["backups"]) == 3

    # Filtra por manual
    res_manual = client.get("/api/backup/list?backup_type=manual")
    assert res_manual.status_code == 200
    assert res_manual.json()["total"] == 1
    assert res_manual.json()["backups"][0]["backup_type"] == "manual"

    # Filtra por automatic
    res_auto = client.get("/api/backup/list?backup_type=automatic")
    assert res_auto.status_code == 200
    assert res_auto.json()["total"] == 1
    assert res_auto.json()["backups"][0]["backup_type"] == "automatic"

    # Filtra por imported
    res_imported = client.get("/api/backup/list?backup_type=imported")
    assert res_imported.status_code == 200
    assert res_imported.json()["total"] == 1
    assert res_imported.json()["backups"][0]["backup_type"] == "imported"


def test_get_and_update_schedule_settings(client, db_session):
    # GET inicial
    res_get = client.get("/api/backup/schedule")
    assert res_get.status_code == 200
    data = res_get.json()
    assert data["frequency_hours"] == 24
    assert data["is_active"] is True
    assert data["retention_limit"] == 30

    # UPDATE
    update_payload = {
        "is_active": False,
        "frequency_hours": 6,
        "s3_folder": "empresa/backups/",
        "retention_limit": 15
    }
    res_post = client.post("/api/backup/schedule", json=update_payload)
    assert res_post.status_code == 200
    updated = res_post.json()
    assert updated["is_active"] is False
    assert updated["frequency_hours"] == 6
    assert updated["s3_folder"] == "empresa/backups/"
    assert updated["retention_limit"] == 15


def test_import_external_backup_api(client, db_session):
    # Upload válido (.sql)
    file_bytes = b"-- Test SQL Dump\nCREATE TABLE test_table (id int);"
    files = {"file": ("meu_banco.sql", io.BytesIO(file_bytes), "application/sql")}
    res = client.post("/api/backup/import", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["backup"]["backup_type"] == "imported"
    assert "meu_banco" in data["backup"]["filename"]

    # Upload inválido (extensão não aceita)
    invalid_files = {"file": ("virus.exe", io.BytesIO(b"malicious"), "application/octet-stream")}
    res_inv = client.post("/api/backup/import", files=invalid_files)
    assert res_inv.status_code == 400


def test_download_backup(client, db_session):
    service = BackupService(db_session)
    backup = service.create_backup(backup_type="manual")

    res = client.get(f"/api/backup/download/{backup.id}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/gzip"
    assert len(res.content) > 0


def test_restore_backup(client, db_session):
    service = BackupService(db_session)
    backup = service.create_backup(backup_type="manual")

    res = client.post(f"/api/backup/restore/{backup.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "restaurado com sucesso" in data["message"].lower()

    # Tenta restaurar ID inexistente
    res_404 = client.post("/api/backup/restore/99999")
    assert res_404.status_code == 400


def test_delete_backup(client, db_session):
    service = BackupService(db_session)
    backup = service.create_backup(backup_type="manual")
    b_id = backup.id

    res = client.delete(f"/api/backup/{b_id}")
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Confirma que foi deletado do banco
    deleted = db_session.query(BackupRecord).filter(BackupRecord.id == b_id).first()
    assert deleted is None


def test_retention_policy_enforcement(client, db_session):
    service = BackupService(db_session)
    # Define retenção para 2 backups
    settings_record = service.get_or_create_schedule_settings()
    settings_record.retention_limit = 2
    db_session.commit()

    # Cria 3 backups
    b1 = service.create_backup(backup_type="manual")
    b2 = service.create_backup(backup_type="manual")
    b3 = service.create_backup(backup_type="manual")

    # Verifica quantos backups restaram no banco
    records = db_session.query(BackupRecord).all()
    assert len(records) == 2
    ids = [r.id for r in records]
    assert b1.id not in ids  # O mais antigo b1 deve ter sido rotacionado/excluído
    assert b2.id in ids
    assert b3.id in ids
