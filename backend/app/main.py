from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.database import engine, Base
from app.api.posts import router as posts_router
from app.api.platforms import router as platforms_router
from app.api.health import router as health_router
from app.api.ai import router as ai_router
from app.api.auth import router as auth_router, init_super_admin
from app.api.users import router as users_router
from app.api.invitations import router as invitations_router
from app.api.logs import router as logs_router
from app.api.backup import router as backup_router

logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa tabelas e Super Admin a partir do .env se conectado ao banco de dados
    try:
        Base.metadata.create_all(bind=engine)
        init_super_admin()
    except Exception as e:
        print(f"[Aviso] Não foi possível inicializar tabelas/super admin automaticamente no startup: {e}")
    # Garante que diretório de uploads existe
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API de Agendamento e Publicação de Vídeos para Instagram, YouTube e TikTok",
    version="1.0.0",
    lifespan=lifespan
)

# Configura CORS para permitir acesso do React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos de upload para reprodução de vídeo no frontend
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Rotas
app.include_router(posts_router, prefix=settings.API_V1_STR)
app.include_router(platforms_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(invitations_router, prefix=settings.API_V1_STR)
app.include_router(logs_router, prefix=settings.API_V1_STR)
app.include_router(backup_router, prefix=settings.API_V1_STR)



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro inesperado em {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."}
    )


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_version": "v1",
        "status": "running"
    }
