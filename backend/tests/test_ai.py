import io
import pytest
from app.services.ai_service import transcribe_video_file, generate_social_content, generate_thumbnail

@pytest.mark.asyncio
async def test_transcribe_video_simulation():
    # Sem API key, retorna transcrição simulada com o contexto do nome do arquivo
    text = await transcribe_video_file("uploads/meu_video.mp4", filename="meu_video.mp4")
    assert isinstance(text, str)
    assert len(text) > 20
    assert "meu video" in text.lower() or "vídeo" in text.lower()

@pytest.mark.asyncio
async def test_transcribe_video_with_base_text():
    # Teste de transcrição com texto base / roteiro de referência
    text = await transcribe_video_file(
        "uploads/meu_video.mp4",
        filename="meu_video.mp4",
        base_text="Roteiro sobre automação de postagens e IA generativa."
    )
    assert isinstance(text, str)
    assert "automação" in text.lower() or "vídeo" in text.lower()

@pytest.mark.asyncio
async def test_generate_social_content_simulation():
    transcription = "Neste vídeo vamos aprender 3 motivos para contratar uma assessoria de marketing e automatizar tudo."
    result = await generate_social_content(
        transcription=transcription,
        platforms=["instagram", "youtube", "tiktok"],
        title_hint="3 Motivos Para Contratar",
        duration_seconds=45.0,
        base_text="Texto base do roteiro: Foque em economia de tempo e consistência diária."
    )

    assert "transcription" in result
    assert "instagram" in result
    assert "youtube" in result
    assert "tiktok" in result

    # 1. Instagram: legenda + 5 hashtags
    ig = result["instagram"]
    assert "caption" in ig
    assert len(ig["hashtags"]) == 5
    assert all(h.startswith("#") for h in ig["hashtags"])

    # 2. YouTube: título magnético de cauda longa + 3 opções + descrição com capítulos e pontos + tags + shorts/vídeo
    yt = result["youtube"]
    assert "title" in yt
    assert isinstance(yt["title"], str) and len(yt["title"]) > 10
    assert "title_options" in yt
    assert len(yt["title_options"]) >= 3
    assert all(isinstance(t, str) and len(t) > 5 for t in yt["title_options"])
    assert "description" in yt
    assert "Capítulos" in yt["description"] or "00:00" in yt["description"] or len(yt["description"]) > 30
    assert "Principais Pontos" in yt["description"] or "-" in yt["description"] or len(yt["description"]) > 50
    assert len(yt["tags"]) >= 3
    assert yt["video_type"] in ["Shorts", "Vídeo Padrão"]

    # 3. TikTok: legenda dinâmica + 5 hashtags (sem emojis decorativos excessivos)
    tk = result["tiktok"]
    assert "caption" in tk
    assert len(tk["hashtags"]) == 5
    assert all(h.startswith("#") for h in tk["hashtags"])
    assert "🚀" not in ig["caption"]
    assert "🔥" not in tk["caption"]

def test_ai_api_transcribe_and_generate_endpoint(client):
    fake_video = io.BytesIO(b"fake video bytes content for ai test")
    
    response = client.post(
        "/api/ai/transcribe-and-generate",
        data={
            "title": "3 Motivos para Contratar",
            "platforms": "instagram,youtube,tiktok",
            "youtube_instructions": "Foque em tom descontraído e mencione mentoria no final.",
            "base_text": "Roteiro: Automatize publicações e economize 10 horas semanais."
        },
        files={"video": ("3_motivos.mp4", fake_video, "video/mp4")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "transcription" in data
    assert len(data["instagram"]["hashtags"]) >= 3
    assert "Shorts" in data["youtube"]["video_type"] or "Vídeo" in data["youtube"]["video_type"]
    assert len(data["youtube"]["title_options"]) >= 3
    assert len(data["tiktok"]["hashtags"]) >= 3

def test_ai_api_generate_from_transcription_endpoint(client):
    response = client.post(
        "/api/ai/generate-from-transcription",
        data={
            "transcription": "Texto transcrito de exemplo com dicas práticas.",
            "title": "Dicas de IA",
            "platforms": "instagram,youtube,tiktok",
            "youtube_instructions": "Inclua links para o WhatsApp da comunidade.",
            "base_text": "Texto base com tópicos principais de IA."
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcription"] == "Texto transcrito de exemplo com dicas práticas."
    assert "instagram" in data
    assert "youtube" in data
    assert len(data["youtube"]["title_options"]) >= 3
    assert "tiktok" in data

@pytest.mark.asyncio
async def test_generate_thumbnail_reels_and_youtube():
    # 1. Teste formato Reels (9:16)
    res_reels = await generate_thumbnail(
        title="Como Criar Conteúdo Rápido",
        transcription="Neste vídeo rápido mostro ferramentas essenciais.",
        format_type="reels"
    )
    assert res_reels["format"] == "reels"
    assert "uploads/thumbnails" in res_reels["thumbnail_path"]
    assert "9:16" in res_reels["prompt_used"] or "Reels" in res_reels["prompt_used"]

    # 2. Teste formato YouTube Longo (16:9) com texto de referência
    res_yt = await generate_thumbnail(
        title="Guia Completo de Marketing para 2026",
        transcription="Aula detalhada passo a passo de como estruturar seu canal.",
        format_type="youtube_long",
        reference_text="Estilo cyberpunk com tons neon roxos e azuis"
    )
    assert res_yt["format"] == "youtube_long"
    assert "uploads/thumbnails" in res_yt["thumbnail_path"]
    assert "16:9" in res_yt["prompt_used"] or "YouTube" in res_yt["prompt_used"]
    assert "cyberpunk" in res_yt["prompt_used"].lower()

def test_ai_api_generate_thumbnail_endpoint(client):
    response = client.post(
        "/api/ai/generate-thumbnail",
        data={
            "title": "Thumb Incrível",
            "format_type": "youtube_long",
            "prompt_hint": "cores neon e visual cinematográfico",
            "reference_text": "iluminação dramática com contraste forte"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["format"] == "youtube_long"
    assert "thumbnail_url" in data
    assert "thumbnail_path" in data

def test_ai_api_generate_thumbnail_with_reference_images(client):
    fake_img1 = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    fake_img2 = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")

    response = client.post(
        "/api/ai/generate-thumbnail",
        data={
            "title": "Thumb com Referências Visuais",
            "format_type": "reels",
            "reference_text": "Manter paleta escura com luz de recorte e elementos 3D"
        },
        files=[
            ("reference_images", ("ref1.png", fake_img1, "image/png")),
            ("reference_images", ("ref2.png", fake_img2, "image/png"))
        ]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["format"] == "reels"
    assert "thumbnail_url" in data
    assert "thumbnail_path" in data
