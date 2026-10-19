import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Post, PlatformPublication, PostMetricSnapshot, PublicationStatus, PlatformType
from app.services.metrics_collector import metrics_collector

logger = logging.getLogger("api.analytics")

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.post("/sync")
async def trigger_metrics_sync(
    max_posts: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Dispara a sincronização manual de métricas das redes sociais
    para todas as publicações recentes.
    """
    try:
        result = await metrics_collector.sync_all_recent_published_posts(db, max_posts=max_posts)
        return {
            "success": True,
            "message": "Sincronização de métricas realizada com sucesso.",
            "data": result
        }
    except Exception as e:
        logger.error(f"Erro ao disparar sincronização de métricas: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro na sincronização de métricas: {str(e)}")


@router.post("/posts/{post_id}/sync")
async def sync_single_post_metrics(
    post_id: int,
    db: Session = Depends(get_db)
):
    """
    Sincroniza as métricas das redes sociais para um post específico sob demanda.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    updated_snapshots = []
    for pub in post.publications:
        if pub.status == PublicationStatus.PUBLISHED.value and pub.external_post_id:
            try:
                snap = await metrics_collector.sync_publication_metrics(pub, db)
                if snap:
                    updated_snapshots.append({
                        "platform": snap.platform,
                        "views": snap.views,
                        "likes": snap.likes,
                        "comments": snap.comments,
                        "shares": snap.shares,
                        "saves": snap.saves,
                        "collected_at": (snap.collected_at or utcnow()).isoformat()
                    })
            except Exception as e:
                logger.warning(f"Erro ao sincronizar pub #{pub.id}: {e}")

    return {
        "success": True,
        "post_id": post_id,
        "synchronized_platforms": updated_snapshots
    }


@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Retorna o resumo consolidado de métricas reais de todos os vídeos publicados.
    """
    # Consulta métricas agregadas da tabela platform_publications
    totals = db.query(
        func.coalesce(func.sum(PlatformPublication.last_views), 0).label("total_views"),
        func.coalesce(func.sum(PlatformPublication.last_likes), 0).label("total_likes"),
        func.coalesce(func.sum(PlatformPublication.last_comments), 0).label("total_comments"),
        func.coalesce(func.sum(PlatformPublication.last_shares), 0).label("total_shares"),
        func.max(PlatformPublication.last_metrics_sync_at).label("last_synced_at")
    ).filter(PlatformPublication.status == PublicationStatus.PUBLISHED.value).first()

    # Agregação por plataforma
    platform_rows = db.query(
        PlatformPublication.platform,
        func.coalesce(func.sum(PlatformPublication.last_views), 0).label("views"),
        func.coalesce(func.sum(PlatformPublication.last_likes), 0).label("likes"),
        func.coalesce(func.sum(PlatformPublication.last_comments), 0).label("comments"),
        func.coalesce(func.sum(PlatformPublication.last_shares), 0).label("shares"),
        func.count(PlatformPublication.id).label("total_published")
    ).filter(
        PlatformPublication.status == PublicationStatus.PUBLISHED.value
    ).group_by(PlatformPublication.platform).all()

    by_platform = {}
    for r in platform_rows:
        by_platform[r.platform] = {
            "views": int(r.views),
            "likes": int(r.likes),
            "comments": int(r.comments),
            "shares": int(r.shares),
            "total_published": int(r.total_published)
        }

    return {
        "total_views": int(totals.total_views) if totals else 0,
        "total_likes": int(totals.total_likes) if totals else 0,
        "total_comments": int(totals.total_comments) if totals else 0,
        "total_shares": int(totals.total_shares) if totals else 0,
        "last_synced_at": totals.last_synced_at.isoformat() if totals and totals.last_synced_at else None,
        "by_platform": by_platform
    }


@router.get("/history/{post_id}")
def get_post_metrics_history(
    post_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna o histórico de snapshots coletados para um vídeo ao longo do tempo.
    """
    snapshots = (
        db.query(PostMetricSnapshot)
        .filter(PostMetricSnapshot.post_id == post_id)
        .order_by(PostMetricSnapshot.collected_at.asc())
        .all()
    )

    return [
        {
            "id": s.id,
            "platform": s.platform,
            "views": s.views,
            "likes": s.likes,
            "comments": s.comments,
            "shares": s.shares,
            "retention_rate_pct": s.retention_rate_pct,
            "ctr_pct": s.ctr_pct,
            "collected_at": s.collected_at.isoformat()
        }
        for s in snapshots
    ]


@router.get("/winning-formula")
def get_channel_winning_formula(db: Session = Depends(get_db)):
    """
    Retorna o diagnóstico da Fórmula Vencedora do canal com base nos vídeos publicados.
    """
    from app.services.winning_formula_service import winning_formula_service
    return winning_formula_service.detect_winning_formula(db)


@router.get("/posts/{post_id}/diagnosis")
def get_post_ai_diagnosis(
    post_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna o diagnóstico detalhado de IA (Raio-X de Retenção e Gancho) para um vídeo específico.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    from app.services.winning_formula_service import winning_formula_service
    return winning_formula_service.diagnose_post(post, db)


@router.post("/posts/{post_id}/generate-scripts")
async def generate_post_script_variations(
    post_id: int,
    db: Session = Depends(get_db)
):
    """
    Gera 5 variações completas de roteiro prontas para gravar com base no aprendizado do vídeo selecionado.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    from app.services.winning_formula_service import winning_formula_service
    scripts = await winning_formula_service.generate_script_variations(post)
    return {
        "success": True,
        "post_id": post.id,
        "base_title": post.title,
        "scripts": scripts
    }
