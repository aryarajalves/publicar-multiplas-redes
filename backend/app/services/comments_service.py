import logging
from typing import Optional, List, Dict, Any
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Post, PlatformPublication
from app.publishers.youtube import YouTubePublisher

logger = logging.getLogger("services.comments")


class CommentsService:
    @staticmethod
    async def get_comments(post_id: int, platform: str, db: Session) -> Dict[str, Any]:
        """
        Busca os comentários reais de uma publicação específica no Instagram ou YouTube.
        """
        plat = platform.lower().strip()
        pub = db.query(PlatformPublication).filter(
            PlatformPublication.post_id == post_id,
            PlatformPublication.platform == plat
        ).first()

        if not pub:
            return {
                "success": False,
                "platform": plat,
                "detail": f"Publicação não encontrada para a plataforma '{plat}'.",
                "total_count": 0,
                "comments": []
            }

        if pub.status != "published":
            return {
                "success": False,
                "platform": plat,
                "detail": f"O post ainda não foi publicado no {plat} (status: {pub.status}).",
                "total_count": 0,
                "comments": []
            }

        if not pub.external_post_id:
            return {
                "success": False,
                "platform": plat,
                "detail": "ID externo da publicação não registrado no sistema.",
                "total_count": 0,
                "comments": []
            }

        if plat == "instagram":
            return await CommentsService._get_instagram_comments(pub.external_post_id)
        elif plat == "youtube":
            return await CommentsService._get_youtube_comments(pub.external_post_id)
        else:
            return {
                "success": False,
                "platform": plat,
                "detail": f"Leitura de comentários não suportada para '{plat}'.",
                "total_count": 0,
                "comments": []
            }

    @staticmethod
    async def _get_instagram_comments(media_id: str) -> Dict[str, Any]:
        token = (settings.INSTAGRAM_ACCESS_TOKEN or "").strip()
        if not token:
            return {
                "success": False,
                "platform": "instagram",
                "detail": "Token do Instagram (INSTAGRAM_ACCESS_TOKEN) não configurado no .env.",
                "total_count": 0,
                "comments": []
            }

        url = f"https://graph.facebook.com/v22.0/{media_id}/comments"
        params = {
            "fields": "id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}",
            "access_token": token,
            "limit": 50
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(url, params=params)
                data = res.json()

                if res.status_code == 200:
                    raw_comments = data.get("data", [])
                    parsed_comments = []
                    for c in raw_comments:
                        replies_data = c.get("replies", {}).get("data", [])
                        parsed_replies = [
                            {
                                "id": r.get("id"),
                                "username": r.get("username") or "usuário",
                                "text": r.get("text") or "",
                                "timestamp": r.get("timestamp"),
                                "like_count": int(r.get("like_count") or 0)
                            }
                            for r in replies_data
                        ]
                        parsed_comments.append({
                            "id": c.get("id"),
                            "platform": "instagram",
                            "username": c.get("username") or "usuário",
                            "avatar": None,
                            "text": c.get("text") or "",
                            "timestamp": c.get("timestamp"),
                            "like_count": int(c.get("like_count") or 0),
                            "replies": parsed_replies
                        })

                    return {
                        "success": True,
                        "platform": "instagram",
                        "total_count": len(parsed_comments),
                        "comments": parsed_comments
                    }

                # Tratamento de erros da Meta API
                err = data.get("error", {})
                err_msg = err.get("message", "Erro desconhecido na Meta API")
                err_code = err.get("code")
                logger.warning(f"[Instagram Comments] Erro {res.status_code} da Meta: {err}")

                if "instagram_manage_comments" in err_msg or err_code in (200, 10, 100):
                    detail = (
                        "O token do Instagram não possui a permissão 'instagram_manage_comments'. "
                        "Habilite essa permissão no Meta Developers para visualizar os comentários."
                    )
                else:
                    detail = f"Meta API: {err_msg}"

                return {
                    "success": False,
                    "platform": "instagram",
                    "detail": detail,
                    "total_count": 0,
                    "comments": []
                }
        except Exception as e:
            logger.error(f"[Instagram Comments] Exceção na requisição: {e}", exc_info=True)
            return {
                "success": False,
                "platform": "instagram",
                "detail": f"Erro de conexão com o Instagram: {str(e)}",
                "total_count": 0,
                "comments": []
            }

    @staticmethod
    async def _get_youtube_comments(video_id: str) -> Dict[str, Any]:
        yt_pub = YouTubePublisher()
        token = await yt_pub.get_access_token()
        if not token:
            return {
                "success": False,
                "platform": "youtube",
                "detail": "Não foi possível obter token de acesso do YouTube (verifique YOUTUBE_REFRESH_TOKEN no .env).",
                "total_count": 0,
                "comments": []
            }

        url = "https://www.googleapis.com/youtube/v3/commentThreads"
        params = {
            "part": "snippet,replies",
            "videoId": video_id,
            "maxResults": 50,
            "textFormat": "plainText"
        }
        headers = {"Authorization": f"Bearer {token}"}

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(url, params=params, headers=headers)
                data = res.json()

                if res.status_code == 200:
                    items = data.get("items", [])
                    parsed_comments = []
                    for item in items:
                        top = item.get("snippet", {}).get("topLevelComment", {})
                        top_snip = top.get("snippet", {})

                        # Respostas aninhadas
                        raw_replies = item.get("replies", {}).get("comments", [])
                        parsed_replies = [
                            {
                                "id": r.get("id"),
                                "username": r.get("snippet", {}).get("authorDisplayName") or "usuário",
                                "text": r.get("snippet", {}).get("textOriginal") or r.get("snippet", {}).get("textDisplay") or "",
                                "timestamp": r.get("snippet", {}).get("publishedAt"),
                                "like_count": int(r.get("snippet", {}).get("likeCount") or 0)
                            }
                            for r in raw_replies
                        ]

                        parsed_comments.append({
                            "id": top.get("id") or item.get("id"),
                            "platform": "youtube",
                            "username": top_snip.get("authorDisplayName") or "usuário",
                            "avatar": top_snip.get("authorProfileImageUrl"),
                            "text": top_snip.get("textOriginal") or top_snip.get("textDisplay") or "",
                            "timestamp": top_snip.get("publishedAt"),
                            "like_count": int(top_snip.get("likeCount") or 0),
                            "replies": parsed_replies
                        })

                    return {
                        "success": True,
                        "platform": "youtube",
                        "total_count": len(parsed_comments),
                        "comments": parsed_comments
                    }

                err = data.get("error", {})
                err_msg = err.get("message", "Erro desconhecido na Google API")
                logger.warning(f"[YouTube Comments] Erro {res.status_code} da Google: {err}")

                if "disabled comments" in err_msg.lower():
                    detail = "Os comentários estão desativados neste vídeo do YouTube."
                elif "insufficient" in err_msg.lower() or "permission" in err_msg.lower() or res.status_code == 403:
                    detail = (
                        "O token do YouTube não possui o escopo 'youtube.force-ssl'. "
                        "Gere um novo token no Google OAuth Playground com esse escopo para ler os comentários."
                    )
                else:
                    detail = f"YouTube API: {err_msg}"

                return {
                    "success": False,
                    "platform": "youtube",
                    "detail": detail,
                    "total_count": 0,
                    "comments": []
                }
        except Exception as e:
            logger.error(f"[YouTube Comments] Exceção na requisição: {e}", exc_info=True)
            return {
                "success": False,
                "platform": "youtube",
                "detail": f"Erro de conexão com o YouTube: {str(e)}",
                "total_count": 0,
                "comments": []
            }

    @staticmethod
    async def send_reply(post_id: int, platform: str, message: str, comment_id: Optional[str], db: Session) -> Dict[str, Any]:
        """
        Envia uma resposta a um comentário ou adiciona um novo comentário no post.
        """
        plat = platform.lower().strip()
        pub = db.query(PlatformPublication).filter(
            PlatformPublication.post_id == post_id,
            PlatformPublication.platform == plat
        ).first()

        if not pub or not pub.external_post_id:
            return {"success": False, "detail": "Publicação não encontrada nesta plataforma."}

        if plat == "instagram":
            return await CommentsService._reply_instagram(pub.external_post_id, message, comment_id)
        elif plat == "youtube":
            return await CommentsService._reply_youtube(pub.external_post_id, message, comment_id)
        else:
            return {"success": False, "detail": f"Respostas não suportadas para '{plat}'."}

    @staticmethod
    async def _reply_instagram(media_id: str, message: str, comment_id: Optional[str]) -> Dict[str, Any]:
        token = (settings.INSTAGRAM_ACCESS_TOKEN or "").strip()
        if not token:
            return {"success": False, "detail": "Token do Instagram não configurado."}

        # Se comment_id informado, responde a ele. Caso contrário, comenta no post.
        target_id = comment_id if comment_id else media_id
        endpoint = "replies" if comment_id else "comments"
        url = f"https://graph.facebook.com/v22.0/{target_id}/{endpoint}"

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, data={"message": message, "access_token": token})
                data = res.json()

                if res.status_code == 200 and "id" in data:
                    logger.info(f"[Instagram Reply] Resposta enviada com sucesso: {data['id']}")
                    return {
                        "success": True,
                        "id": data["id"],
                        "message": "Resposta enviada com sucesso ao Instagram!"
                    }

                err = data.get("error", {})
                err_msg = err.get("message", "Falha ao enviar resposta na Meta API")
                logger.error(f"[Instagram Reply] Erro: {err}")

                if "instagram_manage_comments" in err_msg:
                    detail = "Permissão 'instagram_manage_comments' necessária no token do Instagram para postar respostas."
                else:
                    detail = f"Erro no Instagram: {err_msg}"

                return {"success": False, "detail": detail}
        except Exception as e:
            logger.error(f"[Instagram Reply] Exceção: {e}", exc_info=True)
            return {"success": False, "detail": f"Erro de conexão com o Instagram: {str(e)}"}

    @staticmethod
    async def _reply_youtube(video_id: str, message: str, comment_id: Optional[str]) -> Dict[str, Any]:
        yt_pub = YouTubePublisher()
        token = await yt_pub.get_access_token()
        if not token:
            return {"success": False, "detail": "Não foi possível autenticar com o YouTube (token expirado)."}

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                if comment_id:
                    # Resposta a comentário existente
                    url = "https://www.googleapis.com/youtube/v3/comments?part=snippet"
                    payload = {
                        "snippet": {
                            "parentId": comment_id,
                            "textOriginal": message
                        }
                    }
                else:
                    # Comentário no topo do vídeo
                    url = "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet"
                    payload = {
                        "snippet": {
                            "videoId": video_id,
                            "topLevelComment": {
                                "snippet": {
                                    "textOriginal": message
                                }
                            }
                        }
                    }

                res = await client.post(url, json=payload, headers=headers)
                data = res.json()

                if res.status_code in (200, 201) and "id" in data:
                    logger.info(f"[YouTube Reply] Resposta enviada com sucesso: {data['id']}")
                    return {
                        "success": True,
                        "id": data["id"],
                        "message": "Resposta enviada com sucesso ao YouTube!"
                    }

                err = data.get("error", {})
                err_msg = err.get("message", "Falha ao responder comentário no YouTube")
                logger.error(f"[YouTube Reply] Erro: {err}")

                if "insufficient" in err_msg.lower() or "permission" in err_msg.lower() or res.status_code == 403:
                    detail = "Escopo 'youtube.force-ssl' necessário no token do YouTube para postar respostas."
                else:
                    detail = f"Erro no YouTube: {err_msg}"

                return {"success": False, "detail": detail}
        except Exception as e:
            logger.error(f"[YouTube Reply] Exceção: {e}", exc_info=True)
            return {"success": False, "detail": f"Erro de conexão com o YouTube: {str(e)}"}
