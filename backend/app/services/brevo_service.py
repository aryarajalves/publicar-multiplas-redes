import logging
import requests
from app.config import settings

logger = logging.getLogger("services.brevo")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def build_verification_email_html(to_name: str, code: str) -> str:
    """Gera template de e-mail HTML moderno e responsivo com branding MultiPost."""
    name_display = to_name.strip() if to_name else "Membro"
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação MultiPost</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Multi<span style="color: #ec4899;">Post</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">
                Plataforma Unificada de Publicação e Agendamento
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 16px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                Confirmação de E-mail
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                Olá, <strong>{name_display}</strong>! Você foi convidado para criar uma conta na plataforma <strong>MultiPost</strong>. Utilize o código de verificação abaixo para confirmar seu e-mail:
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #030712; border: 1px solid #ec4899; border-radius: 14px; padding: 18px 24px; box-shadow: 0 0 20px rgba(236, 72, 153, 0.15);">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f472b6; text-shadow: 0 0 10px rgba(244, 114, 182, 0.4);">
                      {code}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ⏱ Este código expira em <strong>15 minutos</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center; line-height: 18px;">
                Se você não solicitou este cadastro, desconsidere esta mensagem com segurança.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; 2026 MultiPost • Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_verification_code_email(to_email: str, to_name: str, code: str) -> tuple[bool, str | None]:
    """
    Dispara o e-mail transacional contendo o código OTP de 6 dígitos via API do Brevo.
    Retorna uma tupla (sucesso: bool, motivo_erro: Optional[str]).
    Se BREVO_API_KEY não estiver configurada, informa claramente que o serviço não está conectado.
    """
    normalized_email = to_email.strip().lower()
    api_key = settings.BREVO_API_KEY.strip() if settings.BREVO_API_KEY else ""

    if not api_key:
        if settings.SIMULATE_PUBLICATIONS:
            logger.info(
                f"[Brevo Service - MODO SIMULAÇÃO TESTES] Código OTP para '{normalized_email}': {code}"
            )
            return True, None

        reason = (
            "O serviço de e-mail (Brevo) não está conectado. "
            "A chave 'BREVO_API_KEY' não foi configurada no arquivo .env do servidor."
        )
        logger.warning(f"[Brevo Service] {reason}")
        return False, reason

    sender_email = settings.BREVO_SENDER_EMAIL.strip() if settings.BREVO_SENDER_EMAIL else ""
    if not sender_email:
        sender_email = "contato@multipost.com"

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME or "MultiPost",
            "email": sender_email,
        },
        "to": [
            {
                "email": normalized_email,
                "name": to_name.strip() if to_name else normalized_email,
            }
        ],
        "subject": f"Seu código de verificação MultiPost: {code}",
        "htmlContent": build_verification_email_html(to_name, code),
    }

    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=15,
        )
        if response.status_code in (200, 201, 202):
            logger.info(
                f"[Brevo Service] Código OTP enviado com sucesso para {normalized_email} (Status: {response.status_code})"
            )
            return True, None
        else:
            try:
                err_data = response.json()
                detail = err_data.get("message") or err_data.get("code") or response.text
            except Exception:
                detail = response.text
            error_reason = f"O Brevo recusou o envio (Status {response.status_code}): {detail}"
            logger.error(f"[Brevo Service] {error_reason}")
            return False, error_reason
    except Exception as exc:
        error_reason = f"Falha de conexão com a API do Brevo: {exc}"
        logger.error(f"[Brevo Service] {error_reason}")
        return False, error_reason


def build_password_reset_email_html(to_name: str, reset_url: str) -> str:
    """Gera template de e-mail HTML moderno para redefinição de senha no MultiPost."""
    name_display = to_name.strip() if to_name else "Membro"
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha MultiPost</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6);"></td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Multi<span style="color: #ec4899;">Post</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">
                Plataforma Unificada de Publicação e Agendamento
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                Redefinição de Senha
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                Olá, <strong>{name_display}</strong>! Foi solicitada a criação de uma nova senha para a sua conta na plataforma <strong>MultiPost</strong>. Clique no botão abaixo para definir sua nova senha:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{reset_url}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(90deg, #ec4899, #8b5cf6); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(236, 72, 153, 0.4);">
                      Criar Nova Senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ⏱ Este link é de uso único e expira em <strong>24 horas</strong>.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #64748b; line-height: 16px; word-break: break-all; text-align: center;">
                Ou copie e cole o link direto no seu navegador:<br>
                <a href="{reset_url}" style="color: #ec4899; text-decoration: underline;">{reset_url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; 2026 MultiPost • Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_email(to_email: str, to_name: str, reset_url: str) -> tuple[bool, str | None]:
    """Dispara e-mail com link de redefinição de senha via API do Brevo."""
    normalized_email = to_email.strip().lower()
    api_key = settings.BREVO_API_KEY.strip() if settings.BREVO_API_KEY else ""

    if not api_key:
        if settings.SIMULATE_PUBLICATIONS:
            logger.info(
                f"[Brevo Service - SIMULAÇÃO] Link de reset para '{normalized_email}': {reset_url}"
            )
            return True, None

        reason = (
            "O serviço de e-mail (Brevo) não está conectado. "
            "A chave 'BREVO_API_KEY' não foi configurada no arquivo .env do servidor."
        )
        logger.warning(f"[Brevo Service] {reason}")
        return False, reason

    sender_email = settings.BREVO_SENDER_EMAIL.strip() if settings.BREVO_SENDER_EMAIL else "contato@multipost.com"
    sender_name = settings.BREVO_SENDER_NAME.strip() if settings.BREVO_SENDER_NAME else "MultiPost"

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email,
        },
        "to": [
            {
                "email": normalized_email,
                "name": to_name.strip() if to_name else normalized_email,
            }
        ],
        "subject": "Redefinição de Senha - MultiPost",
        "htmlContent": build_password_reset_email_html(to_name, reset_url),
    }

    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=15,
        )
        if response.status_code in (200, 201, 202):
            logger.info(f"[Brevo Service] Link de reset enviado com sucesso para {normalized_email}")
            return True, None
        else:
            try:
                err_data = response.json()
                detail = err_data.get("message") or err_data.get("code") or response.text
            except Exception:
                detail = response.text
            error_reason = f"O Brevo recusou o envio (Status {response.status_code}): {detail}"
            logger.error(f"[Brevo Service] {error_reason}")
            return False, error_reason
    except Exception as exc:
        error_reason = f"Falha de conexão com a API do Brevo: {exc}"
        logger.error(f"[Brevo Service] {error_reason}")
        return False, error_reason

