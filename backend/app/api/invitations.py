import logging
import secrets
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Invitation, User, UserRole, EmailVerification
from app.schemas import (
    InvitationCreate,
    InvitationRead,
    InvitationValidateResponse,
    RegisterByInviteRequest,
    SendVerificationCodeRequest,
    SendVerificationCodeResponse,
    UserRead,
)
from app.api.users import hash_password
from app.services.brevo_service import send_verification_code_email

logger = logging.getLogger("api.invitations")
router = APIRouter(prefix="/invitations", tags=["User Invitations"])


def validate_strong_password(password: str) -> None:
    """
    Valida os 5 requisitos rígidos de senha solicitados:
    - Mínimo de 12 caracteres
    - Pelo menos 1 letra minúscula
    - Pelo menos 1 letra maiúscula
    - Pelo menos 1 número
    - Pelo menos 1 caractere especial
    """
    if len(password) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter no mínimo 12 caracteres."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos uma letra minúscula."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos uma letra maiúscula."
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos um número."
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\\/\[\]~`]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos um caractere especial (ex: @, #, $, !, %)."
        )


@router.post("/", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
def create_invitation(payload: InvitationCreate, db: Session = Depends(get_db)):
    """
    Gera um novo link de convite exclusivo com prazo de expiração.
    Permite apenas perfis Admin ou Editor (Super Admin é único e intransferível).
    """
    role = payload.role.strip().lower()
    if role not in [UserRole.ADMIN.value, UserRole.EDITOR.value]:
        role = UserRole.EDITOR.value

    # Valida horas de expiração válidas (1h, 24h, 72h=3 dias, 168h=7 dias)
    hours = payload.expires_in_hours if payload.expires_in_hours in [1, 24, 72, 168] else 24

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=hours)
    token = secrets.token_urlsafe(32)

    invitation = Invitation(
        token=token,
        role=role,
        expires_at=expires_at,
        is_used=False
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    frontend_base = settings.FRONTEND_URL.rstrip("/")
    invite_url = f"{frontend_base}/cadastro?token={token}"

    logger.info(f"[Invitations] Novo convite gerado para role '{role}' com validade de {hours}h (token={token[:8]}...)")

    return InvitationRead(
        id=invitation.id,
        token=invitation.token,
        role=invitation.role,
        expires_at=invitation.expires_at,
        is_used=invitation.is_used,
        used_by_email=invitation.used_by_email,
        created_at=invitation.created_at,
        invite_url=invite_url
    )


@router.get("/", response_model=List[InvitationRead])
def list_invitations(db: Session = Depends(get_db)):
    """Lista todos os convites gerados para acompanhamento."""
    invitations = db.query(Invitation).order_by(Invitation.created_at.desc()).limit(200).all()
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    result = []
    for inv in invitations:
        result.append(
            InvitationRead(
                id=inv.id,
                token=inv.token,
                role=inv.role,
                expires_at=inv.expires_at,
                is_used=inv.is_used,
                used_by_email=inv.used_by_email,
                used_at=inv.used_at,
                created_at=inv.created_at,
                invite_url=f"{frontend_base}/cadastro?token={inv.token}"
            )
        )
    return result


@router.delete("/{invitation_id}")
def delete_invitation(invitation_id: int, db: Session = Depends(get_db)):
    """Exclui ou revoga um link de convite existente."""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite não encontrado."
        )
    db.delete(invitation)
    db.commit()
    logger.info(f"[Invitations] Convite #{invitation_id} excluído com sucesso.")
    return {"success": True, "message": "Convite removido com sucesso."}


@router.get("/{token}", response_model=InvitationValidateResponse)
def validate_invitation(token: str, db: Session = Depends(get_db)):
    """
    Verifica se um token de convite é válido, não expirado e não utilizado.
    Utilizado pela tela de cadastro antes de exibir o formulário.
    """
    invitation = db.query(Invitation).filter(Invitation.token == token.strip()).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link de convite inválido ou inexistente."
        )

    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de convite já foi utilizado para criar uma conta."
        )

    now = datetime.now(timezone.utc)
    exp = invitation.expires_at if invitation.expires_at.tzinfo else invitation.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de convite expirou. Solicite um novo link ao administrador."
        )

    is_brevo_connected = bool(settings.BREVO_API_KEY and settings.BREVO_API_KEY.strip())
    return InvitationValidateResponse(
        valid=True,
        role=invitation.role,
        expires_at=invitation.expires_at,
        message="Convite válido e ativo.",
        email_service_configured=is_brevo_connected
    )


@router.post("/{token}/send-code", response_model=SendVerificationCodeResponse)
def send_verification_code(
    token: str,
    payload: SendVerificationCodeRequest,
    db: Session = Depends(get_db)
):
    """
    Gera e envia um código numérico de 6 dígitos para o e-mail do usuário convidado via API do Brevo.
    Valida previamente o link do convite e bloqueia caso o e-mail já esteja cadastrado.
    """
    invitation = db.query(Invitation).filter(Invitation.token == token.strip()).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link de convite inválido ou inexistente."
        )

    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de convite já foi utilizado para criar uma conta."
        )

    now = datetime.now(timezone.utc)
    exp = invitation.expires_at if invitation.expires_at.tzinfo else invitation.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de convite expirou. Solicite um novo link ao administrador."
        )

    normalized_email = payload.email.strip().lower()

    # Validação rigorosa de e-mail duplicado
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma conta cadastrada com este endereço de e-mail."
        )

    # Gera código OTP seguro de 6 dígitos numéricos (ex: 849201)
    code = f"{secrets.randbelow(900000) + 100000:06d}"
    expires_at = now + timedelta(minutes=15)

    # Remove códigos não verificados anteriores desse e-mail para este convite
    db.query(EmailVerification).filter(
        EmailVerification.email == normalized_email,
        EmailVerification.token == token.strip(),
        EmailVerification.is_verified == False
    ).delete()

    verification = EmailVerification(
        email=normalized_email,
        code=code,
        token=token.strip(),
        expires_at=expires_at,
        is_verified=False
    )
    db.add(verification)
    db.commit()

    # Dispara e-mail via API do Brevo
    success, error_reason = send_verification_code_email(to_email=normalized_email, to_name="", code=code)
    if not success:
        logger.error(f"[Invitations] Falha no disparo de e-mail para '{normalized_email}': {error_reason}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_reason
        )

    logger.info(f"[Invitations] Código de verificação gerado para '{normalized_email}' (Convite: {token[:8]}...)")

    return SendVerificationCodeResponse(
        success=True,
        message="Código de verificação enviado com sucesso para o seu e-mail.",
        email=normalized_email
    )


@router.post("/{token}/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_by_invite(token: str, payload: RegisterByInviteRequest, db: Session = Depends(get_db)):
    """
    Cadastra um novo usuário no sistema através de um link de convite validado.
    Exige nome, e-mail, whatsapp, código de verificação enviado por e-mail (Brevo) e senha de 12+ caracteres.
    """
    invitation = db.query(Invitation).filter(Invitation.token == token.strip()).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link de convite inválido ou inexistente."
        )

    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de convite já foi utilizado."
        )

    now = datetime.now(timezone.utc)
    exp = invitation.expires_at if invitation.expires_at.tzinfo else invitation.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de convite expirou. Solicite um novo link ao administrador."
        )

    # Validação rigorosa dos 5 requisitos de senha
    validate_strong_password(payload.password)

    normalized_email = payload.email.strip().lower()

    # Validação de e-mail duplicado
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma conta cadastrada com este endereço de e-mail."
        )

    # Validação do código de verificação de e-mail (OTP de 6 dígitos)
    code_entered = payload.verification_code.strip()
    verification = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == normalized_email,
            EmailVerification.token == token.strip(),
            EmailVerification.code == code_entered,
            EmailVerification.is_verified == False
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificação incorreto ou inválido. Confira seu e-mail ou solicite um novo código."
        )

    verif_exp = (
        verification.expires_at
        if verification.expires_at.tzinfo
        else verification.expires_at.replace(tzinfo=timezone.utc)
    )
    if verif_exp < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O código de verificação expirou (validade de 15 minutos). Solicite um novo código."
        )

    # Marca código como verificado com sucesso
    verification.is_verified = True
    verification.verified_at = now

    # Cria o novo usuário com a role do convite e senha criptografada via Argon2id (RAM)
    new_user = User(
        name=payload.name.strip(),
        email=normalized_email,
        whatsapp=payload.whatsapp.strip(),
        hashed_password=hash_password(payload.password),
        role=invitation.role,
        is_active=True
    )
    db.add(new_user)

    # Marca o convite como utilizado
    invitation.is_used = True
    invitation.used_by_email = normalized_email
    invitation.used_at = now

    db.commit()
    db.refresh(new_user)

    logger.info(f"[Invitations] Novo usuário registrado com sucesso via convite: {new_user.email} (Role: {new_user.role})")
    return new_user
