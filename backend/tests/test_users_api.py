from app.models import User
from app.api.users import hash_password, verify_password

def test_hash_and_verify_password():
    pwd = "MinhaSenhaForte@2026"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert hashed.startswith("$argon2id$")
    assert "m=65536" in hashed  # 64MB de memória RAM
    assert verify_password(pwd, hashed) is True
    assert verify_password("SenhaErrada", hashed) is False

def test_create_and_list_users(client, db_session):
    # Cria usuário 1
    res1 = client.post(
        "/api/users/",
        json={
            "name": "Gestor de Contas",
            "email": "gestor@multipost.com",
            "password": "senhaSegura123",
            "role": "admin"
        }
    )
    assert res1.status_code == 201
    user1 = res1.json()
    assert user1["id"] is not None
    assert user1["name"] == "Gestor de Contas"
    assert user1["email"] == "gestor@multipost.com"
    assert user1["role"] == "admin"
    assert "password" not in user1
    assert "hashed_password" not in user1

    # Cria usuário 2 (Editor)
    res2 = client.post(
        "/api/users/",
        json={
            "name": "Editor de Conteúdo",
            "email": "editor@multipost.com",
            "password": "outraSenha456",
            "role": "editor"
        }
    )
    assert res2.status_code == 201
    user2 = res2.json()

    # Listar usuários
    list_res = client.get("/api/users/")
    assert list_res.status_code == 200
    users = list_res.json()
    assert len(users) >= 2
    emails = [u["email"] for u in users]
    assert "gestor@multipost.com" in emails
    assert "editor@multipost.com" in emails

def test_create_user_duplicate_email(client):
    # Cria o primeiro usuário
    client.post(
        "/api/users/",
        json={
            "name": "Admin Original",
            "email": "duplicado@multipost.com",
            "password": "senhaQualquer123"
        }
    )
    # Tenta criar clone com o mesmo e-mail
    res = client.post(
        "/api/users/",
        json={
            "name": "Clone User",
            "email": "duplicado@multipost.com",
            "password": "outraSenha123"
        }
    )
    assert res.status_code == 400
    assert "Já existe um usuário" in res.json()["detail"]

def test_update_user(client):
    res_create = client.post(
        "/api/users/",
        json={
            "name": "Editor Inicial",
            "email": "update_test@multipost.com",
            "password": "senhaSegura123",
            "role": "editor"
        }
    )
    assert res_create.status_code == 201
    user_id = res_create.json()["id"]

    res = client.put(
        f"/api/users/{user_id}",
        json={
            "name": "Editor Atualizado",
            "role": "admin",
            "is_active": False
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Editor Atualizado"
    assert data["role"] == "admin"
    assert data["is_active"] is False

def test_delete_user(client):
    from app.config import settings

    # Busca o Super Admin inicial
    users_list = client.get("/api/users/").json()
    super_admin = next((u for u in users_list if u["email"] == settings.SUPER_ADMIN_EMAIL.lower()), None)
    assert super_admin is not None

    # Tenta excluir o Super Admin -> deve bloquear com 400
    res_del_super = client.delete(f"/api/users/{super_admin['id']}")
    assert res_del_super.status_code == 400
    assert "Super Administrador" in res_del_super.json()["detail"]

    # Cria dois novos usuários
    res1 = client.post(
        "/api/users/",
        json={
            "name": "Primeiro Admin",
            "email": "primeiro@multipost.com",
            "password": "senhaSegura123"
        }
    )
    res2 = client.post(
        "/api/users/",
        json={
            "name": "Segundo Editor",
            "email": "segundo@multipost.com",
            "password": "senhaSegura456"
        }
    )
    user1_id = res1.json()["id"]
    user2_id = res2.json()["id"]

    # Exclui o segundo usuário com sucesso
    res_del = client.delete(f"/api/users/{user2_id}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True

    # Verifica que o segundo usuário não existe mais
    check_res = client.get(f"/api/users/{user2_id}")
    assert check_res.status_code == 404

    # Exclui o primeiro usuário com sucesso
    res_del_1 = client.delete(f"/api/users/{user1_id}")
    assert res_del_1.status_code == 200

def test_send_reset_password_and_confirm(client, monkeypatch):
    import app.api.users as users_module
    sent_emails = []
    def fake_send_password_reset_email(to_email, reset_url, to_name=None, **kwargs):
        sent_emails.append({"to_email": to_email, "reset_url": reset_url, "to_name": to_name})
        return True, "E-mail de redefinição enviado com sucesso via Brevo."
    monkeypatch.setattr(users_module, "send_password_reset_email", fake_send_password_reset_email)

    # 1. Cria usuário para teste de reset
    res = client.post(
        "/api/users/",
        json={
            "name": "Usuario Reset",
            "email": "reset_test@multipost.com",
            "password": "SenhaInicial@2026",
            "role": "editor"
        }
    )
    assert res.status_code == 201
    user_id = res.json()["id"]

    # 2. Dispara reset de senha
    reset_res = client.post(f"/api/users/{user_id}/send-reset-password")
    assert reset_res.status_code == 200
    data = reset_res.json()
    assert data["success"] is True
    assert "reset_url" in data
    token = data["reset_url"].split("token=")[1]
    assert len(sent_emails) == 1
    assert sent_emails[0]["to_email"] == "reset_test@multipost.com"

    # 3. Valida token via GET
    token_res = client.get(f"/api/auth/reset-password/{token}")
    assert token_res.status_code == 200
    token_data = token_res.json()
    assert token_data["valid"] is True
    assert token_data["email"] == "reset_test@multipost.com"

    # 4. Tenta redefinir com senha inválida (muito curta, validação Pydantic -> 422)
    bad_res = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "curta"}
    )
    assert bad_res.status_code == 422

    # 4.1 Tenta redefinir com 12+ caracteres mas sem maiúscula/número/especial -> 400
    bad_crit = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "senhasemnadaextra1234"}
    )
    assert bad_crit.status_code == 400
    assert "pelo menos uma letra maiúscula" in bad_crit.json()["detail"]

    # 5. Redefine com senha forte válida
    nova_senha = "NovaSenhaForte@2026"
    ok_res = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": nova_senha}
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["success"] is True

    # 6. Tenta reutilizar o token -> deve bloquear
    reused_res = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "OutraSenhaForte@2026"}
    )
    assert reused_res.status_code == 400
    assert "utilizado" in reused_res.json()["detail"]

    # 7. Super Admin não pode ter reset disparado
    from app.config import settings
    users_list = client.get("/api/users/").json()
    super_admin = next((u for u in users_list if u["email"] == settings.SUPER_ADMIN_EMAIL.lower()), None)
    if super_admin:
        block_res = client.post(f"/api/users/{super_admin['id']}/send-reset-password")
        assert block_res.status_code == 400
        assert "Super Administrador" in block_res.json()["detail"]


