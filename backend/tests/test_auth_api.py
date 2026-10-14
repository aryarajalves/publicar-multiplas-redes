from unittest.mock import patch, MagicMock
from app.config import settings
from app.models import SocialAccount

def test_tiktok_login_endpoint(client):
    response = client.get("/api/auth/tiktok/login")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "https://www.tiktok.com/v2/auth/authorize/" in data["url"]
    assert "video.publish" in data["url"]
    assert "video.upload" in data["url"]
    assert "state" in data

def test_get_connected_accounts_endpoint(client, db_session):
    response = client.get("/api/auth/accounts")
    assert response.status_code == 200
    data = response.json()
    assert "tiktok" in data
    assert "youtube" in data
    assert "instagram" in data
    assert isinstance(data["tiktok"]["connected"], bool)

def test_tiktok_callback_missing_code(client):
    response = client.get("/api/auth/tiktok/callback")
    assert response.status_code == 400
    assert "Código de autorização" in response.json()["detail"]

def test_tiktok_callback_with_error(client):
    response = client.get("/api/auth/tiktok/callback?error=access_denied&error_description=User+cancelled")
    assert response.status_code == 400
    assert "Falha na Autorização do TikTok" in response.text

def test_tiktok_disconnect_endpoint(client, db_session):
    # Insere conta de teste
    acc = db_session.query(SocialAccount).filter(SocialAccount.platform == "tiktok").first()
    if not acc:
        acc = SocialAccount(platform="tiktok", account_name="@test_user", is_connected=True, access_token="token123")
        db_session.add(acc)
    else:
        acc.is_connected = True
        acc.access_token = "token123"
    db_session.commit()

    response = client.post("/api/auth/tiktok/disconnect")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verifica que ficou desconectado
    acc_updated = db_session.query(SocialAccount).filter(SocialAccount.platform == "tiktok").first()
    assert acc_updated.is_connected is False
    assert acc_updated.access_token is None

def test_login_success(client):
    # Cria usuário via /api/users/
    create_res = client.post(
        "/api/users/",
        json={
            "name": "Operador Login",
            "email": "login_test@multipost.com",
            "password": "senhaCorreta123",
            "role": "admin"
        }
    )
    assert create_res.status_code == 201

    # Realiza login com sucesso
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "login_test@multipost.com",
            "password": "senhaCorreta123"
        }
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["success"] is True
    assert data["user"]["email"] == "login_test@multipost.com"
    assert "Bem-vindo" in data["message"]

def test_login_invalid_password(client):
    client.post(
        "/api/users/",
        json={
            "name": "Operador Teste",
            "email": "user_pwd@multipost.com",
            "password": "senhaCerta123"
        }
    )
    res = client.post(
        "/api/auth/login",
        json={
            "email": "user_pwd@multipost.com",
            "password": "senhaErrada123"
        }
    )
    assert res.status_code == 401
    assert "incorretos" in res.json()["detail"]

def test_logout_endpoint(client):
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["success"] is True

def test_super_admin_bootstrap_and_login(client):
    from app.config import settings

    # Realiza login usando diretamente as credenciais do Super Admin definidas no .env
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": settings.SUPER_ADMIN_EMAIL,
            "password": settings.SUPER_ADMIN_PASSWORD
        }
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["success"] is True
    assert data["user"]["email"] == settings.SUPER_ADMIN_EMAIL.lower()
    assert data["user"]["role"] == "admin"
    assert data["user"]["is_active"] is True

def test_super_admin_password_sync(client, db_session):
    from app.config import settings
    from app.api.auth import init_super_admin

    # Simula mudança de senha do Super Admin no .env
    original_pwd = settings.SUPER_ADMIN_PASSWORD
    try:
        settings.SUPER_ADMIN_PASSWORD = "novaSenhaSuperAdmin999"
        # Executa sincronização
        user = init_super_admin(db_session)
        assert user is not None

        # Tenta login com a nova senha
        login_res = client.post(
            "/api/auth/login",
            json={
                "email": settings.SUPER_ADMIN_EMAIL,
                "password": "novaSenhaSuperAdmin999"
            }
        )
        assert login_res.status_code == 200
        assert login_res.json()["success"] is True
    finally:
        settings.SUPER_ADMIN_PASSWORD = original_pwd
        init_super_admin(db_session)


