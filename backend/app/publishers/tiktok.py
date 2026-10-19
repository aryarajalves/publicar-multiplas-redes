import logging
import asyncio
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
from app.config import settings
from app.database import SessionLocal
from app.models import Post, PlatformPublication, SocialAccount, PublicationSetting
from app.publishers.base import BasePublisher, PublicationResult

logger = logging.getLogger("publishers.tiktok")

class TikTokPublisher(BasePublisher):
    platform_name = "tiktok"

    def is_configured(self) -> bool:
        if bool(settings.TIKTOK_ACCESS_TOKEN):
            return True
        try:
            with SessionLocal() as db:
                account = db.query(SocialAccount).filter(
                    SocialAccount.platform == "tiktok",
                    SocialAccount.is_connected == True
                ).first()
                return bool(account and account.access_token)
        except Exception:
            return False

    async def get_valid_access_token(self) -> Optional[str]:
        """
        Retorna um access token válido. Se a conta no banco possuir refresh_token
        e o access_token estiver próximo de expirar (ou expirado), renova automaticamente.
        """
        try:
            with SessionLocal() as db:
                account = db.query(SocialAccount).filter(
                    SocialAccount.platform == "tiktok",
                    SocialAccount.is_connected == True
                ).first()

                if account and account.access_token:
                    now = datetime.now(timezone.utc)
                    is_expired = False
                    if account.token_expires_at:
                        # Se expirar em menos de 5 minutos, considera expirado para renovar
                        if now >= (account.token_expires_at - timedelta(minutes=5)):
                            is_expired = True

                    if is_expired and account.refresh_token and settings.TIKTOK_CLIENT_KEY and settings.TIKTOK_CLIENT_SECRET:
                        logger.info("[TikTok] Token expirado ou próximo de expirar. Renovando via Refresh Token...")
                        try:
                            async with httpx.AsyncClient(timeout=30.0) as client:
                                refresh_res = await client.post(
                                    "https://open.tiktokapis.com/v2/oauth/token/",
                                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                                    data={
                                        "client_key": settings.TIKTOK_CLIENT_KEY,
                                        "client_secret": settings.TIKTOK_CLIENT_SECRET,
                                        "grant_type": "refresh_token",
                                        "refresh_token": account.refresh_token
                                    }
                                )
                                r_json = refresh_res.json()
                                r_data = r_json.get("data", {})
                                new_token = r_data.get("access_token")
                                if new_token:
                                    account.access_token = new_token
                                    account.refresh_token = r_data.get("refresh_token") or account.refresh_token
                                    exp_in = r_data.get("expires_in", 86400)
                                    account.token_expires_at = now + timedelta(seconds=exp_in)
                                    account.updated_at = now
                                    db.commit()
                                    logger.info("[TikTok] Token renovado com sucesso!")
                                    return new_token
                        except Exception as e:
                            logger.error(f"[TikTok] Erro ao renovar token com refresh_token: {e}")

                    return account.access_token
        except Exception as e:
            logger.warning(f"[TikTok] Erro ao verificar token dinâmico no banco: {e}")

        return settings.TIKTOK_ACCESS_TOKEN or None

    async def publish(self, post: Post, publication: PlatformPublication) -> PublicationResult:
        logger.info(f"[TikTok] Iniciando cross-posting para o Post #{post.id} ('{post.title}')")

        if settings.SIMULATE_PUBLICATIONS:
            await asyncio.sleep(1.0)
            mock_id = f"tk_video_{post.id}_{int(asyncio.get_event_loop().time() * 1000)}"
            mock_url = f"https://www.tiktok.com/@creator/video/{mock_id}"
            logger.info(f"[TikTok] [SIMULADO] Cross-post publicado com sucesso! URL: {mock_url}")
            return PublicationResult(
                success=True,
                external_post_id=mock_id,
                post_url=mock_url
            )

        access_token = await self.get_valid_access_token()
        if not access_token:
            return PublicationResult(
                success=False,
                error_message="Credenciais do TikTok não configuradas. Conecte sua conta pelo painel MultiPost ou informe TIKTOK_ACCESS_TOKEN no .env."
            )

        # Localiza o arquivo de vídeo no disco
        video_file = Path(post.video_path)
        if not video_file.exists():
            video_file = Path(settings.UPLOAD_DIR) / video_file.name

        if not video_file.exists():
            return PublicationResult(
                success=False,
                error_message=f"Arquivo de vídeo não encontrado no caminho: {post.video_path}"
            )

        file_size = video_file.stat().st_size

        # Publicação Real via TikTok Content Posting API v2 com Upload Binário Direto (FILE_UPLOAD)
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                if post.tiktok_caption:
                    tk_text = post.tiktok_caption
                    if post.tiktok_hashtags:
                        tk_text = f"{tk_text} {post.tiktok_hashtags}"
                else:
                    tk_text = f"{post.title} {post.caption or ''}".strip()

                # Anexa hashtags de localização se configurado nas preferências
                try:
                    with SessionLocal() as db:
                        pub_setting = db.query(PublicationSetting).first()
                        if pub_setting and pub_setting.apply_location_to_all and pub_setting.tiktok_location_hashtags:
                            extra_tags = pub_setting.tiktok_location_hashtags.strip()
                            if extra_tags and extra_tags.lower() not in tk_text.lower():
                                tk_text = f"{tk_text} {extra_tags}".strip()
                                logger.info(f"[TikTok] Hashtags de localização padrão anexadas: {extra_tags}")
                except Exception as e:
                    logger.warning(f"[TikTok] Não foi possível carregar publication_settings para TikTok: {e}")

                # Passo 1: Inicializa o upload informando o tamanho do arquivo local
                payload = {
                    "post_info": {
                        "title": tk_text[:150],
                        "privacy_level": "PUBLIC_TO_EVERYONE",
                        "disable_duet": False,
                        "disable_comment": False
                    },
                    "source_info": {
                        "source": "FILE_UPLOAD",
                        "video_size": file_size,
                        "chunk_size": file_size,
                        "total_chunk_count": 1
                    }
                }
                res = await client.post(
                    "https://open.tiktokapis.com/v2/post/publish/video/init/",
                    headers=headers,
                    json=payload
                )
                data = res.json()

                if res.status_code == 200 and data.get("error", {}).get("code") == "ok":
                    init_data = data.get("data", {})
                    publish_id = init_data.get("publish_id")
                    upload_url = init_data.get("upload_url")

                    if not upload_url:
                        return PublicationResult(
                            success=False,
                            error_message="TikTok API não retornou upload_url para envio do vídeo."
                        )

                    # Passo 2: Upload binário direto via PUT para a upload_url fornecida pelo TikTok
                    with open(video_file, "rb") as vf:
                        video_content = vf.read()

                    upload_headers = {
                        "Content-Type": "video/mp4",
                        "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
                        "Content-Length": str(file_size)
                    }

                    put_res = await client.put(upload_url, headers=upload_headers, content=video_content)
                    if put_res.status_code in (200, 201):
                        logger.info(f"[TikTok] Upload binário concluído com sucesso para o Publish ID: {publish_id}")
                        return PublicationResult(
                            success=True,
                            external_post_id=publish_id,
                            post_url=f"https://www.tiktok.com/@creator/video/{publish_id}"
                        )
                    else:
                        return PublicationResult(
                            success=False,
                            error_message=f"Falha ao enviar bytes do vídeo para o TikTok: {put_res.status_code} - {put_res.text}"
                        )
                else:
                    return PublicationResult(
                        success=False,
                        error_message=f"Erro TikTok API: {res.text}"
                    )
        except Exception as e:
            logger.error(f"[TikTok] Exceção durante cross-posting: {e}", exc_info=True)
            return PublicationResult(success=False, error_message=str(e))

