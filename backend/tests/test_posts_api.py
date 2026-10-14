import io
import json
from datetime import datetime, timedelta, timezone

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"] == "connected"

def test_create_and_schedule_post(client):
    fake_video = io.BytesIO(b"fake video content")
    scheduled_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()

    response = client.post(
        "/api/posts/",
        data={
            "title": "Primeiro Reel de Teste",
            "caption": "Legenda bacana sobre produtividade #dicas",
            "scheduled_at": scheduled_time,
            "platforms": "instagram,youtube,tiktok",
            "publish_now": "false"
        },
        files={"video": ("reel_produtivo.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Primeiro Reel de Teste"
    assert data["status"] == "scheduled"
    assert len(data["publications"]) == 3
    
    platforms_added = {p["platform"] for p in data["publications"]}
    assert platforms_added == {"instagram", "youtube", "tiktok"}

def test_create_post_with_invalid_extension(client):
    fake_doc = io.BytesIO(b"not a video")
    scheduled_time = datetime.now(timezone.utc).isoformat()

    response = client.post(
        "/api/posts/",
        data={
            "title": "Documento",
            "scheduled_at": scheduled_time,
            "platforms": "instagram"
        },
        files={"video": ("arquivo.pdf", fake_doc, "application/pdf")}
    )
    assert response.status_code == 400
    assert "Formato de arquivo não suportado" in response.json()["detail"]

def test_create_and_publish_now(client):
    fake_video = io.BytesIO(b"fake video content")
    scheduled_time = datetime.now(timezone.utc).isoformat()

    response = client.post(
        "/api/posts/",
        data={
            "title": "Reel Publicado Imediatamente",
            "caption": "Publicando agora",
            "scheduled_at": scheduled_time,
            "platforms": "instagram,youtube",
            "publish_now": "true"
        },
        files={"video": ("reel_imediato.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "published"
    ig_pub = next(p for p in data["publications"] if p["platform"] == "instagram")
    assert ig_pub["status"] == "published"
    assert ig_pub["post_url"] is not None

def test_list_posts_and_filtering(client):
    # Cadastra dois posts com características distintas
    video1 = io.BytesIO(b"video 1")
    video2 = io.BytesIO(b"video 2")
    scheduled_future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()

    client.post(
        "/api/posts/",
        data={"title": "Post Instagram Exclusivo", "scheduled_at": scheduled_future, "platforms": "instagram"},
        files={"video": ("v1.mp4", video1, "video/mp4")}
    )
    client.post(
        "/api/posts/",
        data={"title": "Vídeo do TikTok e YouTube", "scheduled_at": scheduled_future, "platforms": "tiktok,youtube"},
        files={"video": ("v2.mp4", video2, "video/mp4")}
    )

    # Listagem geral
    res_all = client.get("/api/posts/")
    assert res_all.status_code == 200
    assert res_all.json()["total"] >= 2

    # Filtro por busca de texto
    res_search = client.get("/api/posts/?search=Exclusivo")
    assert res_search.status_code == 200
    items = res_search.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Post Instagram Exclusivo"

    # Filtro por plataforma
    res_platform = client.get("/api/posts/?platform=tiktok")
    assert res_platform.status_code == 200
    for item in res_platform.json()["items"]:
        platforms = [p["platform"] for p in item["publications"]]
        assert "tiktok" in platforms

def test_get_and_update_post(client):
    video = io.BytesIO(b"video test")
    created = client.post(
        "/api/posts/",
        data={"title": "Título Original", "caption": "Legenda 1", "scheduled_at": datetime.now(timezone.utc).isoformat()},
        files={"video": ("vid.mp4", video, "video/mp4")}
    ).json()

    post_id = created["id"]

    # Obter detalhes
    get_res = client.get(f"/api/posts/{post_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Título Original"

    # Atualizar detalhes
    put_res = client.put(
        f"/api/posts/{post_id}",
        data={"title": "Título Atualizado", "caption": "Nova legenda"}
    )
    assert put_res.status_code == 200
    assert put_res.json()["title"] == "Título Atualizado"
    assert put_res.json()["caption"] == "Nova legenda"

def test_cancel_and_delete_post(client):
    video = io.BytesIO(b"video test")
    created = client.post(
        "/api/posts/",
        data={"title": "Post para Cancelar", "scheduled_at": datetime.now(timezone.utc).isoformat()},
        files={"video": ("to_delete.mp4", video, "video/mp4")}
    ).json()

    post_id = created["id"]

    # Cancelar post
    cancel_res = client.post(f"/api/posts/{post_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Excluir post
    del_res = client.delete(f"/api/posts/{post_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verificar que não existe mais
    get_deleted = client.get(f"/api/posts/{post_id}")
    assert get_deleted.status_code == 404

def test_platforms_overview(client):
    res = client.get("/api/platforms/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_posts" in data
    assert "total_scheduled" in data
    assert "total_published" in data
    assert len(data["platforms"]) == 3

def test_create_post_with_dual_thumbnails(client):
    fake_video = io.BytesIO(b"fake video content")
    fake_vert_thumb = io.BytesIO(b"fake vertical png")
    fake_yt_thumb = io.BytesIO(b"fake horizontal jpg")
    scheduled_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    response = client.post(
        "/api/posts/",
        data={
            "title": "Post com Thumb Vertical e Horizontal",
            "caption": "Vídeo cross-platform com duas capas",
            "scheduled_at": scheduled_time,
            "platforms": "instagram,youtube,tiktok",
            "publish_now": "false"
        },
        files={
            "video": ("video_dual.mp4", fake_video, "video/mp4"),
            "thumbnail": ("reels_cover.png", fake_vert_thumb, "image/png"),
            "youtube_thumbnail": ("yt_wide_cover.jpg", fake_yt_thumb, "image/jpeg"),
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Post com Thumb Vertical e Horizontal"
    assert data["thumbnail_path"] is not None
    assert "uploads/thumbnails/thumb_vertical_" in data["thumbnail_path"]
    assert data["youtube_thumbnail_path"] is not None
    assert "uploads/thumbnails/thumb_youtube_long_" in data["youtube_thumbnail_path"]

def test_create_post_with_youtube_tags_exceeding_limit(client):
    fake_video = io.BytesIO(b"fake video")
    scheduled_time = datetime.now(timezone.utc).isoformat()
    too_long_tags = "tag," * 130 # > 500 chars

    response = client.post(
        "/api/posts/",
        data={
            "title": "Post com Tags Excessivas",
            "scheduled_at": scheduled_time,
            "platforms": "youtube",
            "youtube_tags": too_long_tags
        },
        files={"video": ("video_tags.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 400
    assert "As tags do YouTube não podem ultrapassar 500 caracteres" in response.json()["detail"]

def test_create_post_with_valid_youtube_tags(client):
    fake_video = io.BytesIO(b"fake video")
    scheduled_time = datetime.now(timezone.utc).isoformat()
    valid_tags = "python, fastapi, youtube, shorts, automacao"

    response = client.post(
        "/api/posts/",
        data={
            "title": "Post com Tags Validas",
            "scheduled_at": scheduled_time,
            "platforms": "youtube",
            "youtube_tags": valid_tags
        },
        files={"video": ("video_tags_ok.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["youtube_tags"] == valid_tags

def test_create_post_with_youtube_related_video_success(client):
    fake_video = io.BytesIO(b"fake video")
    scheduled_time = datetime.now(timezone.utc).isoformat()
    related_video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    response = client.post(
        "/api/posts/",
        data={
            "title": "Post com Video Final Recomendado",
            "scheduled_at": scheduled_time,
            "platforms": "youtube",
            "youtube_video_type": "Vídeo Padrão",
            "youtube_related_video": related_video_url
        },
        files={"video": ("video_related.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["youtube_related_video"] == related_video_url
    assert data["youtube_video_type"] == "Vídeo Padrão"

def test_create_post_with_youtube_related_video_exceeding_limit(client):
    fake_video = io.BytesIO(b"fake video")
    scheduled_time = datetime.now(timezone.utc).isoformat()
    too_long_url = "https://youtube.com/watch?v=" + ("a" * 500)

    response = client.post(
        "/api/posts/",
        data={
            "title": "Post com Video Final Muito Longo",
            "scheduled_at": scheduled_time,
            "platforms": "youtube",
            "youtube_related_video": too_long_url
        },
        files={"video": ("video_long_url.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 400
    assert "não pode ultrapassar 500 caracteres" in response.json()["detail"]

def test_update_post_youtube_related_video(client):
    fake_video = io.BytesIO(b"fake video")
    scheduled_time = datetime.now(timezone.utc).isoformat()

    create_res = client.post(
        "/api/posts/",
        data={
            "title": "Post Original",
            "scheduled_at": scheduled_time,
            "platforms": "youtube"
        },
        files={"video": ("orig.mp4", fake_video, "video/mp4")}
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]

    new_related = "https://youtube.com/shorts/xyz123abc"
    update_res = client.put(
        f"/api/posts/{post_id}",
        data={"youtube_related_video": new_related}
    )
    assert update_res.status_code == 200
    assert update_res.json()["youtube_related_video"] == new_related

def test_list_posts_pagination_default_and_custom(client):
    # Cadastra múltiplos posts para testar limites de paginação
    scheduled_time = datetime.now(timezone.utc).isoformat()
    for i in range(5):
        video = io.BytesIO(b"pagination video")
        client.post(
            "/api/posts/",
            data={"title": f"Post Paginado {i}", "scheduled_at": scheduled_time, "platforms": "instagram"},
            files={"video": (f"pag_{i}.mp4", video, "video/mp4")}
        )

    # Teste de paginação com skip e limit
    res_page_1 = client.get("/api/posts/?skip=0&limit=2")
    assert res_page_1.status_code == 200
    data_1 = res_page_1.json()
    assert len(data_1["items"]) == 2
    assert data_1["total"] >= 5

    res_page_2 = client.get("/api/posts/?skip=2&limit=2")
    assert res_page_2.status_code == 200
    data_2 = res_page_2.json()
    assert len(data_2["items"]) == 2
    # Garante que os itens da página 2 não são os mesmos da página 1
    ids_page_1 = {p["id"] for p in data_1["items"]}
    ids_page_2 = {p["id"] for p in data_2["items"]}
    assert ids_page_1.isdisjoint(ids_page_2)

def test_get_youtube_video_options(client):
    fake_video = io.BytesIO(b"fake video youtube option")
    scheduled_time = datetime.now(timezone.utc).isoformat()
    # Post de vídeo longo (deve aparecer)
    create_long = client.post(
        "/api/posts/",
        data={
            "title": "Video Longo Para Opção de Tela Final",
            "youtube_title": "Título Customizado YouTube Longo",
            "youtube_video_type": "Vídeo Padrão",
            "scheduled_at": scheduled_time,
            "platforms": "youtube"
        },
        files={"video": ("yt_option_long.mp4", fake_video, "video/mp4")}
    )
    assert create_long.status_code == 201

    # Post de shorts (NÃO deve aparecer, pois o usuário quer apenas vídeos longos)
    fake_short_video = io.BytesIO(b"fake video short option")
    create_short = client.post(
        "/api/posts/",
        data={
            "title": "Shorts Ignorado",
            "youtube_title": "Shorts Ignorado YouTube",
            "youtube_video_type": "shorts",
            "scheduled_at": scheduled_time,
            "platforms": "youtube"
        },
        files={"video": ("yt_option_short.mp4", fake_short_video, "video/mp4")}
    )
    assert create_short.status_code == 201

    options_res = client.get("/api/posts/youtube-options")
    assert options_res.status_code == 200
    options = options_res.json()
    assert isinstance(options, list)
    assert len(options) >= 1

    # Vídeo longo deve estar presente
    matching_long = next((opt for opt in options if opt["title"] == "Título Customizado YouTube Longo"), None)
    assert matching_long is not None
    assert matching_long["type"] == "video"
    assert "url" in matching_long

    # Shorts NÃO deve estar presente na lista
    matching_short = next((opt for opt in options if opt["title"] == "Shorts Ignorado YouTube"), None)
    assert matching_short is None
