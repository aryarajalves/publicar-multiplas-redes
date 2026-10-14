from datetime import datetime, timezone, timedelta
from app.models import Invitation, User, EmailVerification
from app.config import settings

def test_create_invitation_success(client):
    res = client.post(
        "/api/invitations/",
        json={
            "role": "editor",
            "expires_in_hours": 24
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["id"] is not None
    assert data["token"] is not None
    assert data["role"] == "editor"
    assert "/cadastro?token=" in data["invite_url"]
    assert data["is_used"] is False

def test_validate_invitation_flow(client):
    # Cria convite
    res_create = client.post(
        "/api/invitations/",
        json={"role": "admin", "expires_in_hours": 72}
    )
    assert res_create.status_code == 201
    token = res_create.json()["token"]

    # Valida convite existente
    res_val = client.get(f"/api/invitations/{token}")
    assert res_val.status_code == 200
    assert res_val.json()["valid"] is True
    assert res_val.json()["role"] == "admin"
    assert "email_service_configured" in res_val.json()

    # Token inexistente
    res_invalid = client.get("/api/invitations/token_que_nao_existe_123")
    assert res_invalid.status_code == 404

def test_send_code_brevo_failure(client, monkeypatch):
    # Cria convite
    res_create = client.post(
        "/api/invitations/",
        json={"role": "editor", "expires_in_hours": 24}
    )
    token = res_create.json()["token"]

    import app.api.invitations as inv_module
    monkeypatch.setattr(
        inv_module,
        "send_verification_code_email",
        lambda to_email, to_name, code: (False, "O serviço de e-mail (Brevo) não está conectado. A chave 'BREVO_API_KEY' não foi configurada no arquivo .env do servidor.")
    )

    res = client.post(
        f"/api/invitations/{token}/send-code",
        json={"email": "falha_brevo@multipost.com"}
    )
    assert res.status_code == 400
    assert "não está conectado" in res.json()["detail"]


def test_send_verification_code_and_register_with_argon2(client, db_session):
    # Cria convite
    res_create = client.post(
        "/api/invitations/",
        json={"role": "editor", "expires_in_hours": 24}
    )
    token = res_create.json()["token"]

    # 1. Tenta enviar código para e-mail já cadastrado (Super Admin) -> deve recusar com 400
    dup_res = client.post(
        f"/api/invitations/{token}/send-code",
        json={"email": settings.SUPER_ADMIN_EMAIL}
    )
    assert dup_res.status_code == 400
    assert "já existe uma conta cadastrada" in dup_res.json()["detail"].lower()

    # 2. Envia código para um novo e-mail
    send_res = client.post(
        f"/api/invitations/{token}/send-code",
        json={"email": "integrante@multipost.com"}
    )
    assert send_res.status_code == 200
    assert send_res.json()["success"] is True

    # Obtém o código gerado no banco de dados
    verif = db_session.query(EmailVerification).filter(EmailVerification.email == "integrante@multipost.com").first()
    assert verif is not None
    assert len(verif.code) == 6

    # 3. Tenta registrar com código incorreto -> deve recusar com 400
    wrong_res = client.post(
        f"/api/invitations/{token}/register",
        json={
            "name": "Novo Integrante",
            "email": "integrante@multipost.com",
            "whatsapp": "11988887777",
            "password": "SenhaSegura@2026",
            "verification_code": "000000"
        }
    )
    assert wrong_res.status_code == 400
    assert "incorreto ou inválido" in wrong_res.json()["detail"]

    # 4. Registra com o código correto
    reg_res = client.post(
        f"/api/invitations/{token}/register",
        json={
            "name": "Novo Integrante",
            "email": "integrante@multipost.com",
            "whatsapp": "11988887777",
            "password": "SenhaSegura@2026",
            "verification_code": verif.code
        }
    )
    assert reg_res.status_code == 201
    user = reg_res.json()
    assert user["name"] == "Novo Integrante"
    assert user["email"] == "integrante@multipost.com"
    assert user["whatsapp"] == "11988887777"
    assert user["role"] == "editor"

    # 5. Valida que a senha foi criptografada com Argon2id (com custo de memória)
    db_user = db_session.query(User).filter(User.email == "integrante@multipost.com").first()
    assert db_user is not None
    assert db_user.hashed_password.startswith("$argon2id$")
    assert "m=65536" in db_user.hashed_password  # 64MB de memória RAM configurados

    # 6. Tenta usar o mesmo token novamente -> deve bloquear
    reg_again = client.post(
        f"/api/invitations/{token}/register",
        json={
            "name": "Outro Tentando Usar",
            "email": "outro@multipost.com",
            "whatsapp": "11999990000",
            "password": "SenhaSegura@2026",
            "verification_code": "123456"
        }
    )
    assert reg_again.status_code == 400
    assert "já foi utilizado" in reg_again.json()["detail"]

def test_password_policy_enforcement(client):
    res_create = client.post("/api/invitations/", json={"role": "editor", "expires_in_hours": 24})
    token = res_create.json()["token"]

    # 1. Menos de 12 caracteres
    r1 = client.post(
        f"/api/invitations/{token}/register",
        json={"name": "Teste", "email": "p1@multipost.com", "whatsapp": "11999998888", "password": "Curta@1", "verification_code": "123456"}
    )
    assert r1.status_code == 400
    assert "12 caracteres" in r1.json()["detail"]

    # 2. Sem letra maiúscula
    r2 = client.post(
        f"/api/invitations/{token}/register",
        json={"name": "Teste", "email": "p2@multipost.com", "whatsapp": "11999998888", "password": "senhaminuscula1@", "verification_code": "123456"}
    )
    assert r2.status_code == 400
    assert "maiúscula" in r2.json()["detail"]

    # 3. Sem letra minúscula
    r3 = client.post(
        f"/api/invitations/{token}/register",
        json={"name": "Teste", "email": "p3@multipost.com", "whatsapp": "11999998888", "password": "SENHAMAISCULA1@", "verification_code": "123456"}
    )
    assert r3.status_code == 400
    assert "minúscula" in r3.json()["detail"]

    # 4. Sem número
    r4 = client.post(
        f"/api/invitations/{token}/register",
        json={"name": "Teste", "email": "p4@multipost.com", "whatsapp": "11999998888", "password": "SenhaSemNumero@", "verification_code": "123456"}
    )
    assert r4.status_code == 400
    assert "número" in r4.json()["detail"]

    # 5. Sem caractere especial
    r5 = client.post(
        f"/api/invitations/{token}/register",
        json={"name": "Teste", "email": "p5@multipost.com", "whatsapp": "11999998888", "password": "SenhaSemEspecial12", "verification_code": "123456"}
    )
    assert r5.status_code == 400
    assert "especial" in r5.json()["detail"]

def test_super_admin_cannot_be_edited(client):
    # Obtém id do super admin
    users = client.get("/api/users/").json()
    super_admin = next((u for u in users if u["email"] == settings.SUPER_ADMIN_EMAIL.lower()), None)
    assert super_admin is not None

    # Tenta editar o super admin -> deve bloquear com 400
    edit_res = client.put(
        f"/api/users/{super_admin['id']}",
        json={"name": "Tentando Alterar Nome", "role": "editor"}
    )
    assert edit_res.status_code == 400
    assert "protegido" in edit_res.json()["detail"]

def test_list_and_delete_invitations(client):
    # Cria convite para testar listagem e exclusão
    res_create = client.post(
        "/api/invitations/",
        json={"role": "editor", "expires_in_hours": 24}
    )
    assert res_create.status_code == 201
    created = res_create.json()
    invite_id = created["id"]

    # Lista convites
    res_list = client.get("/api/invitations/")
    assert res_list.status_code == 200
    invitations = res_list.json()
    assert any(i["id"] == invite_id for i in invitations)

    # Exclui convite
    del_res = client.delete(f"/api/invitations/{invite_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Valida que não consta mais na listagem
    res_list2 = client.get("/api/invitations/")
    assert not any(i["id"] == invite_id for i in res_list2.json())

    # Excluir id inexistente retorna 404
    del_404 = client.delete(f"/api/invitations/{invite_id}")
    assert del_404.status_code == 404


