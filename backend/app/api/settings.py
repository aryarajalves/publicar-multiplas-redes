import logging
import unicodedata
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PublicationSetting, utcnow
from app.schemas import PublicationSettingResponse, PublicationSettingUpdate

logger = logging.getLogger("api.settings")
router = APIRouter(prefix="/settings", tags=["Settings"])

# Catálogo embutido das principais regiões e capitais brasileiras para preenchimento ágil
BRAZILIAN_CITIES_CATALOG = [
    {"name": "São Paulo, SP, Brasil", "city": "São Paulo", "state": "SP", "place_id": None, "hashtags": "#SaoPaulo #SP #Brasil #Sampa"},
    {"name": "Rio de Janeiro, RJ, Brasil", "city": "Rio de Janeiro", "state": "RJ", "place_id": None, "hashtags": "#RioDeJaneiro #RJ #Brasil #Carioca"},
    {"name": "Belo Horizonte, MG, Brasil", "city": "Belo Horizonte", "state": "MG", "place_id": None, "hashtags": "#BeloHorizonte #BH #MG #MinasGerais"},
    {"name": "Curitiba, PR, Brasil", "city": "Curitiba", "state": "PR", "place_id": None, "hashtags": "#Curitiba #CWB #PR #Parana"},
    {"name": "Porto Alegre, RS, Brasil", "city": "Porto Alegre", "state": "RS", "place_id": None, "hashtags": "#PortoAlegre #POA #RS #Gaucho"},
    {"name": "Brasília, DF, Brasil", "city": "Brasília", "state": "DF", "place_id": None, "hashtags": "#Brasilia #BSB #DF #DistritoFederal"},
    {"name": "Salvador, BA, Brasil", "city": "Salvador", "state": "BA", "place_id": None, "hashtags": "#Salvador #BA #Bahia #Nordeste"},
    {"name": "Fortaleza, CE, Brasil", "city": "Fortaleza", "state": "CE", "place_id": None, "hashtags": "#Fortaleza #CE #Ceara #Nordeste"},
    {"name": "Recife, PE, Brasil", "city": "Recife", "state": "PE", "place_id": None, "hashtags": "#Recife #PE #Pernambuco"},
    {"name": "Goiânia, GO, Brasil", "city": "Goiânia", "state": "GO", "place_id": None, "hashtags": "#Goiania #GYN #GO #Goias"},
    {"name": "Campinas, SP, Brasil", "city": "Campinas", "state": "SP", "place_id": None, "hashtags": "#Campinas #SP #InteriorSP"},
    {"name": "Florianópolis, SC, Brasil", "city": "Florianópolis", "state": "SC", "place_id": None, "hashtags": "#Florianopolis #Floripa #SC #SantaCatarina"},
    {"name": "Manaus, AM, Brasil", "city": "Manaus", "state": "AM", "place_id": None, "hashtags": "#Manaus #AM #Amazonas"},
    {"name": "Belém, PA, Brasil", "city": "Belém", "state": "PA", "place_id": None, "hashtags": "#Belem #PA #Para #Norte"},
    {"name": "Vitória, ES, Brasil", "city": "Vitória", "state": "ES", "place_id": None, "hashtags": "#Vitoria #ES #EspiritoSanto"},
    {"name": "Santos, SP, Brasil", "city": "Santos", "state": "SP", "place_id": None, "hashtags": "#Santos #013 #BaixadaSantista #SP"},
    {"name": "Ribeirão Preto, SP, Brasil", "city": "Ribeirão Preto", "state": "SP", "place_id": None, "hashtags": "#RibeiraoPreto #RP #SP"},
]

def _normalize_str(text: str) -> str:
    """Remove acentos e coloca em minúsculas para buscas fonéticas."""
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8").lower()

def _generate_fallback_hashtags(name: str) -> str:
    """Gera hashtags a partir de qualquer nome de cidade digitado."""
    clean = re.sub(r"[^\w\s]", "", name)
    words = [w.capitalize() for w in clean.split() if len(w) > 2]
    tags = ["#" + "".join(words)] if words else []
    for w in words:
        if f"#{w}" not in tags:
            tags.append(f"#{w}")
    if "#Brasil" not in tags:
        tags.append("#Brasil")
    return " ".join(tags[:5])

@router.get("/publication", response_model=PublicationSettingResponse)
def get_publication_settings(db: Session = Depends(get_db)):
    """
    Retorna as preferências de publicação do sistema.
    Caso nenhum registro exista, inicializa um com valores padrão.
    """
    setting = db.query(PublicationSetting).first()
    if not setting:
        logger.info("[Settings] Inicializando registro padrão de publication_settings no banco.")
        setting = PublicationSetting(
            default_location_name="São Paulo, SP, Brasil",
            default_location_id="111524315534407",
            tiktok_location_hashtags="#SaoPaulo #SP #Brasil",
            youtube_location_name="São Paulo, SP, Brasil",
            apply_location_to_all=True,
            updated_at=utcnow()
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("/publication", response_model=PublicationSettingResponse)
def update_publication_settings(payload: PublicationSettingUpdate, db: Session = Depends(get_db)):
    """
    Atualiza as preferências de publicação e localização padrão do sistema.
    """
    setting = db.query(PublicationSetting).first()
    if not setting:
        setting = PublicationSetting()
        db.add(setting)

    setting.default_location_name = payload.default_location_name
    setting.default_location_id = payload.default_location_id
    setting.tiktok_location_hashtags = payload.tiktok_location_hashtags
    setting.youtube_location_name = payload.youtube_location_name
    setting.apply_location_to_all = payload.apply_location_to_all
    setting.updated_at = utcnow()

    db.commit()
    db.refresh(setting)
    logger.info(f"[Settings] Preferências de publicação atualizadas: local='{setting.default_location_name}', apply={setting.apply_location_to_all}")
    return setting

@router.get("/locations/search")
def search_locations(q: str = Query(..., min_length=2, description="Texto para buscar cidade ou localidade")):
    """
    Busca rápida com sugestões de cidades, Place IDs da Meta e hashtags inteligentes para o TikTok.
    """
    query_norm = _normalize_str(q)
    results = []

    for item in BRAZILIAN_CITIES_CATALOG:
        name_norm = _normalize_str(item["name"])
        city_norm = _normalize_str(item["city"])
        state_norm = _normalize_str(item["state"])
        if query_norm in name_norm or query_norm in city_norm or query_norm == state_norm:
            results.append(item)

    # Se não encontrou no catálogo fixo, gera uma sugestão dinâmica
    if not results and len(q.strip()) >= 3:
        clean_name = q.strip()
        results.append({
            "name": clean_name,
            "city": clean_name.split(",")[0].strip(),
            "state": "",
            "place_id": "",
            "hashtags": _generate_fallback_hashtags(clean_name)
        })

    return {"results": results}
