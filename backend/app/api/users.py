import logging
import hashlib
import os
import secrets
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

from app.config import settings
from app.database import get_db
from app.models import User, UserRole, PasswordResetToken
from app.schemas import UserCreate, UserUpdate, UserRead
from app.services.brevo_service import send_password_reset_email

logger = logging.getLogger("api.users")
router = APIRouter(prefix="/users", tags=["Users Management"])

# PasswordHasher configurado com o algoritmo Argon2id memory-hard (exige 64MB de memória RAM)
password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 65536 KiB = 64 MB de memória RAM
    parallelism=4,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Gera hash criptográfico memory-hard utilizando o algoritmo Argon2id com memória RAM."""
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed: str) -> bool:
    """
    Verifica se a senha confere com o hash Argon2id armazenado.
    Possui suporte de compatibilidade retroativa para hashes PBKDF2 legados.
    """
    try:
        if hashed.startswith("$argon2"):
            password_hasher.verify(hashed, plain_password)
            return True

        # Fallback de compatibilidade para PBKDF2 legado (salt:key)
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return secrets.compare_digest(key, expected_key)
    except Exception:
        return False


@router.get("/", response_model=List[UserRead])
def list_users(db: Session = Depends(get_db)):
    """Lista todos os usuários cadastrados no sistema."""
    users = db.query(User).order_by(User.id.asc()).all()
    return users


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Cadastra um novo usuário no sistema."""
    normalized_email = payload.email.strip().lower()

    # Valida unicidade do e-mail
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário cadastrado com este e-mail."
        )

    # Valida role
    role = (payload.role or "admin").strip().lower()
    if role not in [UserRole.ADMIN.value, UserRole.EDITOR.value]:
        role = UserRole.ADMIN.value

    hashed = hash_password(payload.password)

    new_user = User(
        name=payload.name.strip(),
        email=normalized_email,
        whatsapp=payload.whatsapp.strip() if payload.whatsapp else None,
        hashed_password=hashed,
        role=role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"[Users] Novo usuário cadastrado: {new_user.email} (ID #{new_user.id})")
    return new_user


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Retorna detalhes de um usuário pelo ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    """Atualiza informações de um usuário existente."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Impede edição do Super Admin protegido
    super_admin_email = getattr(settings, "SUPER_ADMIN_EMAIL", "admin@multipost.com").strip().lower()
    if user.email.strip().lower() == super_admin_email:
        raise HTTPException(
            status_code=400,
            detail="O Super Administrador é protegido e não pode ser editado via painel."
        )

    if payload.email is not None:
        normalized_email = payload.email.strip().lower()
        if normalized_email != user.email:
            existing = db.query(User).filter(User.email == normalized_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="E-mail já utilizado por outro usuário.")
            user.email = normalized_email

    if payload.whatsapp is not None:
        user.whatsapp = payload.whatsapp.strip() if payload.whatsapp else None

    if payload.name is not None:
        user.name = payload.name.strip()

    if payload.role is not None:
        role = payload.role.strip().lower()
        if role in [UserRole.ADMIN.value, UserRole.EDITOR.value]:
            user.role = role

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.password:
        user.hashed_password = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    logger.info(f"[Users] Usuário #{user.id} atualizado com sucesso.")
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Exclui um usuário do sistema."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Impede exclusão do Super Admin configurado no .env
    super_admin_email = getattr(settings, "SUPER_ADMIN_EMAIL", "admin@multipost.com").strip().lower()
    if user.email.strip().lower() == super_admin_email:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir o Super Administrador principal configurado no .env."
        )

    # Impede exclusão se for o único usuário restante
    total_users = db.query(User).count()
    if total_users <= 1:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir o único usuário do sistema."
        )

    db.delete(user)
    db.commit()
    logger.info(f"[Users] Usuário #{user_id} excluído com sucesso.")
    return {"success": True, "message": "Usuário excluído com sucesso."}


@router.post("/{user_id}/send-reset-password")
def send_user_password_reset(user_id: int, db: Session = Depends(get_db)):
    """Gera um link de redefinição de senha e envia por e-mail (Brevo) ao usuário."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if user.email.lower() == settings.SUPER_ADMIN_EMAIL.lower() or user.role == "super_admin":
        raise HTTPException(
            status_code=400,
            detail="O Super Administrador é o proprietário do sistema e não pode ter sua senha redefinida por esta rota."
        )

    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)

    # Invalida tokens anteriores não usados desse usuário
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False
    ).delete()

    reset_record = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_record)
    db.commit()

    reset_url = f"{settings.FRONTEND_URL}/redefinir-senha?token={token}"
    email_sent, error_reason = send_password_reset_email(
        to_email=user.email,
        to_name=user.name,
        reset_url=reset_url
    )

    logger.info(
        f"[Users] Token de reset gerado para #{user.id} ({user.email}). Email disparado: {email_sent}"
    )
    return {
        "success": True,
        "message": f"Link de redefinição de senha enviado com sucesso para {user.email}.",
        "reset_url": reset_url,
        "email_sent": email_sent,
        "error_reason": error_reason,
        "user_email": user.email,
    }


