import logging
import asyncio
import os
import hashlib
from pathlib import Path
from typing import Optional
import httpx
from app.config import settings
from app.models import Post, PlatformPublication
from app.publishers.base import BasePublisher, PublicationResult

logger = logging.getLogger("publishers.instagram")


class InstagramPublisher(BasePublisher):
    platform_name = "instagram"

    def is_configured(self) -> bool:
        return bool(settings.INSTAGRAM_ACCESS_TOKEN and settings.INSTAGRAM_ACCOUNT_ID)

    def _clean_caption(self, post: Post) -> str:
        """
        Gera e sanitiza a legenda para o Instagram Reels, garantindo respeito
        rigoroso ao teto oficial de 2.200 caracteres da Meta Graph API.
        """
        if post.instagram_caption:
            caption = post.instagram_caption.strip()
            if post.instagram_hashtags:
                caption = f"{caption}\n\n{post.instagram_hashtags.strip()}"
        else:
            caption = f"{post.title}\n\n{post.caption or ''}".strip()

        # O limite da Meta é 2.200 caracteres. Truncamos suavemente em 2.150 com elipse por segurança.
        if len(caption) > 2150:
            caption = caption[:2145].rstrip() + "..."
            logger.info(f"[Instagram] Legenda truncada para {len(caption)} caracteres para atender limites da Meta.")

        return caption

    def _resolve_public_video_url(self, post: Post) -> Optional[str]:
        """
        Resolve ou gera uma URL pública temporária HTTPS para o vídeo.
        A Meta Graph API exige uma URL pública acessível pela internet para que seus crawlers
        façam o download do arquivo de vídeo.
        """
        if post.video_path.startswith(("http://", "https://")):
            return post.video_path

        # Tenta localizar o arquivo local no disco
        raw_path = Path(post.video_path)
        candidates = [
            raw_path,
            Path(settings.UPLOAD_DIR) / raw_path.name,
            Path("/app/uploads") / raw_path.name,
            Path("uploads") / raw_path.name,
        ]

        local_file: Optional[Path] = None
        for cand in candidates:
            if cand.exists() and cand.is_file():
                local_file = cand
                break

        if not local_file:
            logger.error(f"[Instagram] Arquivo de vídeo local não encontrado para post #{post.id} ({post.video_path})")
            return None

        # Se o Backblaze B2 estiver configurado, faz upload e gera URL assinada pública
        key_id = settings.B2_APPLICATION_KEY_ID.strip()
        app_key = settings.B2_APPLICATION_KEY.strip()
        bucket_name = settings.B2_BUCKET_NAME.strip()

        if key_id and app_key and bucket_name:
            try:
                with httpx.Client(timeout=30.0) as client:
                    # 1. Autenticação no B2
                    auth_res = client.get(
                        "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
                        auth=(key_id, app_key)
                    )
                    if auth_res.status_code != 200:
                        logger.error(f"[Instagram] Falha na autenticação B2: {auth_res.text}")
                        return None

                    auth_data = auth_res.json()
                    api_url = auth_data["apiUrl"]
                    auth_token = auth_data["authorizationToken"]
                    bucket_id = auth_data["allowed"].get("bucketId")
                    download_url = auth_data["downloadUrl"]

                    # Se bucketId não veio nas permissões globais, lista os buckets
                    if not bucket_id:
                        list_res = client.post(
                            f"{api_url}/b2api/v2/b2_list_buckets",
                            headers={"Authorization": auth_token},
                            json={"accountId": auth_data["accountId"]}
                        )
                        if list_res.status_code == 200:
                            for b in list_res.json().get("buckets", []):
                                if b.get("bucketName") == bucket_name:
                                    bucket_id = b.get("bucketId")
                                    break

                    if not bucket_id:
                        logger.error(f"[Instagram] Bucket '{bucket_name}' não encontrado no B2.")
                        return None

                    b2_file_name = f"multipost/instagram_reels/{local_file.name}"

                    # 2. Obter URL de upload
                    up_url_res = client.post(
                        f"{api_url}/b2api/v2/b2_get_upload_url",
                        headers={"Authorization": auth_token},
                        json={"bucketId": bucket_id}
                    )
                    if up_url_res.status_code == 200:
                        up_data = up_url_res.json()
                        upload_url = up_data["uploadUrl"]
                        upload_auth = up_data["authorizationToken"]

                        # 3. Ler dados e calcular hash SHA1
                        with open(local_file, "rb") as f:
                            file_bytes = f.read()
                        sha1_hash = hashlib.sha1(file_bytes).hexdigest()

                        put_res = client.post(
                            upload_url,
                            headers={
                                "Authorization": upload_auth,
                                "X-Bz-File-Name": b2_file_name,
                                "Content-Type": "video/mp4",
                                "Content-Length": str(len(file_bytes)),
                                "X-Bz-Content-Sha1": sha1_hash,
                            },
                            content=file_bytes,
                            timeout=180.0
                        )
                        if put_res.status_code != 200:
                            logger.warning(f"[Instagram] Upload B2 respondeu {put_res.status_code}, tentando usar arquivo existente.")

                    # 4. Gera URL pública com download authorization token válido por 24 horas
                    down_auth_res = client.post(
                        f"{api_url}/b2api/v2/b2_get_download_authorization",
                        headers={"Authorization": auth_token},
                        json={
                            "bucketId": bucket_id,
                            "fileNamePrefix": b2_file_name,
                            "validDurationInSeconds": 86400
                        }
                    )
                    if down_auth_res.status_code == 200:
                        d_token = down_auth_res.json().get("authorizationToken")
                        public_url = f"{download_url}/file/{bucket_name}/{b2_file_name}?Authorization={d_token}"
                        logger.info(f"[Instagram] URL pública do vídeo gerada via B2 para entrega à Meta.")
                        return public_url

            except Exception as e:
                logger.error(f"[Instagram] Erro ao sincronizar vídeo no Backblaze B2: {e}")

        return None

    async def publish(self, post: Post, publication: PlatformPublication) -> PublicationResult:
        logger.info(f"[Instagram] Iniciando publicação para o Post #{post.id} ('{post.title}')")

        # Se simulação estiver habilitada explicitamente
        if settings.SIMULATE_PUBLICATIONS:
            await asyncio.sleep(1.0)
            mock_id = f"ig_reel_{post.id}_{int(asyncio.get_event_loop().time() * 1000)}"
            mock_url = f"https://www.instagram.com/reel/{mock_id}/"
            logger.info(f"[Instagram] [SIMULADO] Post publicado com sucesso! URL: {mock_url}")
            return PublicationResult(
                success=True,
                external_post_id=mock_id,
                post_url=mock_url
            )

        if not self.is_configured():
            return PublicationResult(
                success=False,
                error_message="Credenciais do Instagram não configuradas no .env (INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_ACCOUNT_ID)."
            )

        # Publicação Real via Instagram Graph API (Reels)
        try:
            account_id = settings.INSTAGRAM_ACCOUNT_ID
            access_token = settings.INSTAGRAM_ACCESS_TOKEN
            base_url = f"https://graph.facebook.com/v19.0/{account_id}"

            caption = self._clean_caption(post)
            video_url = self._resolve_public_video_url(post)

            if not video_url:
                return PublicationResult(
                    success=False,
                    error_message="Não foi possível obter uma URL pública acessível para o vídeo. Certifique-se de que o Backblaze B2 está configurado."
                )

            async with httpx.AsyncClient(timeout=60.0) as client:
                # Passo 1: Criar container de Reels
                create_res = await client.post(
                    f"{base_url}/media",
                    params={
                        "media_type": "REELS",
                        "video_url": video_url,
                        "caption": caption,
                        "access_token": access_token
                    }
                )

                if create_res.status_code != 200:
                    err = create_res.json().get("error", {}).get("message", create_res.text)
                    return PublicationResult(success=False, error_message=f"Erro ao criar container: {err}")

                container_id = create_res.json().get("id")
                logger.info(f"[Instagram] Container de Reels criado com ID {container_id}. Iniciando polling de processamento...")

                # Passo 2: Polling de status do container (até 30 tentativas = ~2.5 minutos)
                ready = False
                for attempt in range(30):
                    await asyncio.sleep(5)
                    status_res = await client.get(
                        f"https://graph.facebook.com/v19.0/{container_id}",
                        params={"fields": "status_code,status", "access_token": access_token}
                    )
                    status_data = status_res.json()
                    status_code = status_data.get("status_code")

                    logger.info(f"[Instagram] Polling tentativa {attempt + 1}/30: status_code={status_code}")

                    if status_code == "FINISHED":
                        ready = True
                        break
                    elif status_code == "ERROR":
                        err_detail = status_data.get("status", "Erro desconhecido na codificação da Meta")
                        return PublicationResult(success=False, error_message=f"Processamento do vídeo falhou no Instagram: {err_detail}")

                if not ready:
                    return PublicationResult(success=False, error_message="Timeout aguardando processamento do vídeo no Instagram.")

                # Passo 3: Publicar o container
                publish_res = await client.post(
                    f"{base_url}/media_publish",
                    params={
                        "creation_id": container_id,
                        "access_token": access_token
                    }
                )

                if publish_res.status_code != 200:
                    err = publish_res.json().get("error", {}).get("message", publish_res.text)
                    return PublicationResult(success=False, error_message=f"Erro ao publicar no Instagram: {err}")

                published_id = publish_res.json().get("id")

                # Passo 4: Obter permalink oficial do post
                post_url = f"https://www.instagram.com/reel/{published_id}/"
                try:
                    permalink_res = await client.get(
                        f"https://graph.facebook.com/v19.0/{published_id}",
                        params={"fields": "permalink", "access_token": access_token}
                    )
                    if permalink_res.status_code == 200:
                        official_link = permalink_res.json().get("permalink")
                        if official_link:
                            post_url = official_link
                except Exception as perm_err:
                    logger.warning(f"[Instagram] Não foi possível obter permalink direto: {perm_err}")

                logger.info(f"[Instagram] Post #{post.id} publicado com sucesso! URL: {post_url}")
                return PublicationResult(
                    success=True,
                    external_post_id=published_id,
                    post_url=post_url
                )

        except Exception as e:
            logger.error(f"[Instagram] Exceção durante publicação: {e}", exc_info=True)
            return PublicationResult(success=False, error_message=str(e))
