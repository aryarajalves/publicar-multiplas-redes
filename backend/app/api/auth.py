import hashlib
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
import httpx

from app.config import settings
from app.database import get_db
from app.models import SocialAccount, User, PasswordResetToken
from app.schemas import LoginRequest, LoginResponse, ResetPasswordConfirmRequest
from app.api.users import verify_password, hash_password
from app.api.invitations import validate_strong_password

logger = logging.getLogger("api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication & Social Accounts"])

# Armazenamento temporário de PKCE do TikTok (state -> {code_verifier, created_at})
_tiktok_pkce_store: dict[str, dict] = {}


def _clean_expired_pkce_states():
    """Remove estados de PKCE não utilizados com mais de 15 minutos."""
    now = datetime.now(timezone.utc)
    expired = [
        s for s, item in _tiktok_pkce_store.items()
        if (now - item.get("created_at", now)).total_seconds() > 900
    ]
    for s in expired:
        _tiktok_pkce_store.pop(s, None)


@router.get("/tiktok/login")
def tiktok_login(
    redirect: bool = Query(False, description="Se true, redireciona o navegador diretamente")
):
    """
    Gera a URL de consentimento OAuth 2.0 do TikTok com os escopos necessários
    (user.info.basic, video.publish, video.upload) e validação PKCE (code_challenge S256).
    """
    if not settings.TIKTOK_CLIENT_KEY:
        raise HTTPException(
            status_code=400,
            detail="TIKTOK_CLIENT_KEY não configurada no servidor."
        )

    csrf_state = secrets.token_urlsafe(16)
    scope = "user.info.basic,video.publish,video.upload"
    
    # Gera o par PKCE (code_verifier e code_challenge) exigido pelo TikTok v2
    code_verifier = secrets.token_urlsafe(48)
    sha256_hash = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    code_challenge = sha256_hash.hex()

    _clean_expired_pkce_states()
    _tiktok_pkce_store[csrf_state] = {
        "code_verifier": code_verifier,
        "created_at": datetime.now(timezone.utc)
    }

    # URL oficial de autorização do TikTok v2 com suporte a PKCE
    auth_url = (
        f"https://www.tiktok.com/v2/auth/authorize/?"
        f"client_key={settings.TIKTOK_CLIENT_KEY}&"
        f"scope={scope}&"
        f"response_type=code&"
        f"redirect_uri={settings.TIKTOK_REDIRECT_URI}&"
        f"state={csrf_state}&"
        f"code_challenge={code_challenge}&"
        f"code_challenge_method=S256"
    )

    if redirect:
        return RedirectResponse(auth_url)

    return {
        "url": auth_url,
        "state": csrf_state,
        "redirect_uri": settings.TIKTOK_REDIRECT_URI,
        "client_key": settings.TIKTOK_CLIENT_KEY
    }


@router.get("/tiktok/callback")
async def tiktok_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Recebe o código de autorização do TikTok, troca por Access Token e Refresh Token
    utilizando o code_verifier do PKCE, e armazena os dados da conta no banco de dados.
    """
    if error:
        logger.error(f"[TikTok OAuth] Erro retornado pelo TikTok: {error} - {error_description}")
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
              <head><title>Erro TikTok</title><meta charset="utf-8"></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px; background: #f8fafc; color: #1e293b;">
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; max-width: 420px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <h2 style="color: #ea384c; margin-top: 0;">Falha na Autorização do TikTok</h2>
                  <p style="color: #64748b; font-size: 14px;">{error_description or error}</p>
                  <a href="{settings.FRONTEND_URL}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #ea384c; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">Voltar ao MultiPost</a>
                </div>
              </body>
            </html>
            """,
            status_code=400
        )

    if not code:
        raise HTTPException(status_code=400, detail="Código de autorização não fornecido.")

    # Recupera o code_verifier do PKCE correspondente ao state retornado
    pkce_data = _tiktok_pkce_store.pop(state, {}) if state else {}
    code_verifier = pkce_data.get("code_verifier")

    # Troca o code por Access Token e Refresh Token
    token_url = "https://open.tiktokapis.com/v2/oauth/token/"
    token_payload = {
        "client_key": settings.TIKTOK_CLIENT_KEY,
        "client_secret": settings.TIKTOK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.TIKTOK_REDIRECT_URI
    }
    if code_verifier:
        token_payload["code_verifier"] = code_verifier

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_res = await client.post(
                token_url,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data=token_payload
            )
            token_json = token_res.json()

        token_data = token_json.get("data", {})
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        open_id = token_data.get("open_id")
        expires_in = token_data.get("expires_in", 86400)
        refresh_expires_in = token_data.get("refresh_expires_in", 31536000)
        granted_scope = token_data.get("scope", "")

        if not access_token:
            error_msg = token_json.get("error", {}).get("message") or token_res.text
            logger.error(f"[TikTok OAuth] Erro ao obter tokens: {error_msg}")
            raise HTTPException(status_code=400, detail=f"Erro ao obter token do TikTok: {error_msg}")

        now = datetime.now(timezone.utc)
        token_expires_at = now + timedelta(seconds=expires_in)
        refresh_expires_at = now + timedelta(seconds=refresh_expires_in)

        # Buscar dados básicos do perfil para exibir na UI
        account_name = "@tiktok_user"
        avatar_url = None
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                info_res = await client.get(
                    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if info_res.status_code == 200:
                    user_data = info_res.json().get("data", {}).get("user", {})
                    display = user_data.get("display_name")
                    if display:
                        account_name = f"@{display}"
                    avatar_url = user_data.get("avatar_url")
        except Exception as e:
            logger.warning(f"[TikTok OAuth] Não foi possível obter dados complementares do usuário: {e}")

        # Salva ou atualiza a conta no banco de dados
        account = db.query(SocialAccount).filter(SocialAccount.platform == "tiktok").first()
        if not account:
            account = SocialAccount(platform="tiktok")
            db.add(account)

        account.account_id = open_id
        account.account_name = account_name
        account.avatar_url = avatar_url
        account.access_token = access_token
        account.refresh_token = refresh_token
        account.token_expires_at = token_expires_at
        account.refresh_expires_at = refresh_expires_at
        account.scopes = granted_scope
        account.is_connected = True
        account.updated_at = now

        db.commit()
        logger.info(f"[TikTok OAuth] Conta {account_name} conectada com sucesso!")

        # Retorna página HTML que fecha o popup e notifica a tela principal
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
          <head>
            <title>MultiPost - TikTok Conectado</title>
            <meta charset="utf-8">
            <style>
              body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #020617;
                color: #f8fafc;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }}
              .card {{
                background: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 32px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
              }}
              h2 {{ color: #38bdf8; margin-top: 0; }}
              p {{ color: #94a3b8; font-size: 14px; line-height: 1.5; }}
            </style>
          </head>
          <body>
            <div class="card">
              <h2>🎉 Conta Conectada!</h2>
              <p>Sua conta do <strong>TikTok</strong> foi vinculada com sucesso ao <strong>MultiPost</strong>.</p>
              <p>Fechando esta janela em instantes...</p>
            </div>
            <script>
              if (window.opener) {{
                try {{
                  window.opener.postMessage({{ type: 'TIKTOK_AUTH_SUCCESS', account: '{account_name}' }}, '*');
                }} catch (e) {{}}
                setTimeout(function() {{ window.close(); }}, 1500);
              }} else {{
                setTimeout(function() {{ window.location.href = '{settings.FRONTEND_URL}/?tiktok_connected=true'; }}, 1500);
              }}
            </script>
          </body>
        </html>
        """)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TikTok OAuth] Exceção durante troca de token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno no fluxo OAuth: {str(e)}")


@router.get("/accounts")
def get_connected_accounts(db: Session = Depends(get_db)):
    """
    Retorna o status em tempo real de todas as contas integradas ao sistema.
    """
    tiktok_acc = db.query(SocialAccount).filter(SocialAccount.platform == "tiktok").first()
    
    tiktok_connected = False
    tiktok_name = None
    tiktok_avatar = None
    tiktok_expires_at = None

    if tiktok_acc and tiktok_acc.is_connected and tiktok_acc.access_token:
        tiktok_connected = True
        tiktok_name = tiktok_acc.account_name or "@tiktok_user"
        tiktok_avatar = tiktok_acc.avatar_url
        tiktok_expires_at = tiktok_acc.token_expires_at.isoformat() if tiktok_acc.token_expires_at else None
    elif bool(settings.TIKTOK_ACCESS_TOKEN):
        tiktok_connected = True
        tiktok_name = "@tiktok_configurado"

    youtube_connected = bool(settings.YOUTUBE_REFRESH_TOKEN or settings.YOUTUBE_API_KEY)
    instagram_connected = bool(settings.INSTAGRAM_ACCESS_TOKEN)

    return {
        "tiktok": {
            "connected": tiktok_connected,
            "account_name": tiktok_name,
            "avatar_url": tiktok_avatar,
            "expires_at": tiktok_expires_at,
            "redirect_uri": settings.TIKTOK_REDIRECT_URI,
            "client_key": settings.TIKTOK_CLIENT_KEY
        },
        "youtube": {
            "connected": youtube_connected,
            "account_name": "Canal YouTube" if youtube_connected else None
        },
        "instagram": {
            "connected": instagram_connected,
            "account_name": "Instagram Reels" if instagram_connected else None
        }
    }


@router.post("/tiktok/disconnect")
def disconnect_tiktok(db: Session = Depends(get_db)):
    """
    Desconecta a conta do TikTok e remove os tokens do banco de dados.
    """
    account = db.query(SocialAccount).filter(SocialAccount.platform == "tiktok").first()
    if account:
        account.is_connected = False
        account.access_token = None
        account.refresh_token = None
        account.token_expires_at = None
        account.updated_at = datetime.now(timezone.utc)
        db.commit()

    return {
        "success": True,
        "message": "Conta do TikTok desconectada com sucesso."
    }


def init_super_admin(db: Optional[Session] = None) -> Optional[User]:
    """
    Garante a existência e sincronização do Super Administrador com base nas variáveis do .env
    (SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD).
    Garante privilégios plenos (role='admin' e is_active=True).
    """
    admin_name = getattr(settings, "SUPER_ADMIN_NAME", "Super Admin") or "Super Admin"
    admin_email = getattr(settings, "SUPER_ADMIN_EMAIL", "admin@multipost.com") or "admin@multipost.com"
    admin_password = getattr(settings, "SUPER_ADMIN_PASSWORD", "admin123") or "admin123"

    normalized_email = admin_email.strip().lower()
    close_db = False
    if db is None:
        from app.database import SessionLocal
        db = SessionLocal()
        close_db = True

    try:
        user = db.query(User).filter(User.email == normalized_email).first()
        if not user:
            user = User(
                name=admin_name.strip(),
                email=normalized_email,
                hashed_password=hash_password(admin_password),
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"[Auth Bootstrap] Super Admin criado a partir do .env: {normalized_email}")
        else:
            updated = False
            if user.role != "admin":
                user.role = "admin"
                updated = True
            if not user.is_active:
                user.is_active = True
                updated = True
            if not verify_password(admin_password, user.hashed_password):
                user.hashed_password = hash_password(admin_password)
                updated = True
            if updated:
                user.updated_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(user)
                logger.info(f"[Auth Bootstrap] Super Admin sincronizado com credenciais do .env: {normalized_email}")
        return user
    except Exception as e:
        logger.error(f"[Auth Bootstrap] Falha ao sincronizar Super Admin: {e}", exc_info=True)
        db.rollback()
        return None
    finally:
        if close_db:
            db.close()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica um usuário com e-mail e senha.
    Garante sincronização do Super Admin a partir das credenciais do .env.
    """
    normalized_email = payload.email.strip().lower()

    # Garante que o Super Admin definido no .env exista e esteja ativo
    init_super_admin(db)

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este usuário está inativo e não possui permissão de acesso."
        )

    return LoginResponse(
        success=True,
        user=user,
        message=f"Bem-vindo(a) de volta, {user.name}!"
    )


@router.post("/logout")
def logout():
    """
    Encerra a sessão do usuário.
    """
    return {
        "success": True,
        "message": "Sessão encerrada com sucesso."
    }


@router.get("/reset-password/{token}")
def validate_reset_password_token(token: str, db: Session = Depends(get_db)):
    """Valida se o token de redefinição de senha é existente, válido e não expirado."""
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token == token.strip()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link de redefinição de senha inválido ou não encontrado."
        )

    if record.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de redefinição de senha já foi utilizado."
        )

    now = datetime.now(timezone.utc)
    exp = record.expires_at if record.expires_at.tzinfo else record.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de redefinição de senha expirou. Solicite um novo link ao administrador."
        )

    user = record.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário associado a este token não foi encontrado."
        )

    return {
        "valid": True,
        "email": user.email,
        "name": user.name
    }


@router.post("/reset-password")
def confirm_reset_password(payload: ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    """Aplica a nova senha com criptografia Argon2id após validação do token."""
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token == payload.token.strip()).first()
    if not record or record.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de redefinição inválido ou já utilizado."
        )

    now = datetime.now(timezone.utc)
    exp = record.expires_at if record.expires_at.tzinfo else record.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de redefinição expirou. Solicite um novo link ao administrador."
        )

    user = record.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    validate_strong_password(payload.new_password)

    user.hashed_password = hash_password(payload.new_password)
    record.is_used = True
    record.used_at = now
    db.commit()

    logger.info(f"[Auth] Senha do usuário #{user.id} ({user.email}) redefinida com sucesso via token.")
    return {
        "success": True,
        "message": "Sua senha foi redefinida com sucesso! Você já pode acessar a plataforma com suas novas credenciais."
    }


