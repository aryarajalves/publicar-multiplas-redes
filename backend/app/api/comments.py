import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CommentsResponse, CreateCommentRequest
from app.services.comments_service import CommentsService

logger = logging.getLogger("api.comments")

router = APIRouter(prefix="/posts", tags=["Comments"])


@router.get("/{post_id}/comments", response_model=CommentsResponse)
async def get_post_comments(
    post_id: int,
    platform: str = Query(..., description="Plataforma: 'instagram' ou 'youtube'"),
    db: Session = Depends(get_db)
):
    """
    Lista em tempo real os comentários do post no Instagram ou YouTube.
    """
    try:
        result = await CommentsService.get_comments(post_id, platform, db)
        return result
    except Exception as e:
        logger.error(f"Erro ao buscar comentários do post {post_id} ({platform}): {e}", exc_info=True)
        return {
            "success": False,
            "platform": platform,
            "detail": f"Erro interno ao consultar comentários: {str(e)}",
            "total_count": 0,
            "comments": []
        }


@router.post("/{post_id}/comments")
async def send_comment_reply(
    post_id: int,
    payload: CreateCommentRequest,
    db: Session = Depends(get_db)
):
    """
    Envia uma resposta a um comentário ou adiciona um novo comentário na publicação.
    """
    try:
        result = await CommentsService.send_reply(
            post_id=post_id,
            platform=payload.platform,
            message=payload.message,
            comment_id=payload.comment_id,
            db=db
        )
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("detail", "Não foi possível enviar a resposta.")
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao responder comentário no post {post_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao enviar resposta: {str(e)}"
        )
