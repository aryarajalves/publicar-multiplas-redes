import pytest
from app.models import PublicationSetting

def test_get_publication_settings(client):
    response = client.get("/api/settings/publication")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "default_location_name" in data
    assert "apply_location_to_all" in data
    assert data["apply_location_to_all"] is True

def test_update_publication_settings(client):
    payload = {
        "default_location_name": "Curitiba, PR, Brasil",
        "default_location_id": "108347892523293",
        "tiktok_location_hashtags": "#Curitiba #CWB #PR",
        "youtube_location_name": "Curitiba, PR, Brasil",
        "apply_location_to_all": True
    }
    response = client.put("/api/settings/publication", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["default_location_name"] == "Curitiba, PR, Brasil"
    assert data["default_location_id"] == "108347892523293"
    assert data["tiktok_location_hashtags"] == "#Curitiba #CWB #PR"
    assert data["apply_location_to_all"] is True

    # Valida persistência chamando o GET
    get_res = client.get("/api/settings/publication")
    assert get_res.status_code == 200
    assert get_res.json()["default_location_name"] == "Curitiba, PR, Brasil"

def test_search_locations_catalog(client):
    # Busca por 'Sao' deve retornar São Paulo
    res = client.get("/api/settings/locations/search?q=Sao")
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert len(data["results"]) >= 1
    sp = next((r for r in data["results"] if "São Paulo" in r["name"]), None)
    assert sp is not None
    assert sp.get("place_id") is None
    assert "#SaoPaulo" in sp["hashtags"]

def test_search_locations_fallback(client):
    # Busca por cidade desconhecida gera hashtags automáticas
    res = client.get("/api/settings/locations/search?q=Gramado")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) >= 1
    assert "Gramado" in data["results"][0]["name"]
    assert "#Gramado" in data["results"][0]["hashtags"]
