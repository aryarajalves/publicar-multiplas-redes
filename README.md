# 🎬 MultiPost (Publicar Múltiplas Redes)

Plataforma completa para upload, agendamento e publicação automática de vídeos simultaneamente no **Instagram Reels**, **YouTube (Vídeos Longos e Shorts)** e **TikTok**, com painel analítico, gestão de logs em tempo real e backup automatizado em nuvem via **Backblaze B2**.

---

## 🚀 Arquitetura & Tecnologias

- **Backend:** Python 3.12 (FastAPI, SQLAlchemy 2.0, Pydantic V2, Uvicorn, Celery/Redis)
- **Frontend:** React 18 (Vite, TypeScript, Tailwind CSS, Lucide Icons)
- **Banco de Dados:** PostgreSQL 16 (`social-vault-postgres`)
- **Fila & Mensageria:** Redis 7 (`social-broker-redis`)
- **Worker de Agendamento:** Python Scheduler Daemon (`social-scheduler-worker`)
- **Armazenamento em Nuvem:** Backblaze B2 / S3 Storage (Backups e entrega de mídia pública para Meta/Instagram)
- **Servidor Web / Proxy:** Nginx servindo o bundle compilado em produção
- **Containerização:** Docker & Docker Compose (`docker-compose-local.yml`)

---

## 🏷️ Estrutura de Contêineres Docker

| Serviço | Nome do Contêiner | Função | Porta no Host |
| :--- | :--- | :--- | :--- |
| **Banco de Dados** | `social-vault-postgres` | Armazena posts, usuários, agendamentos e histórico | `5438` |
| **Fila & Broker** | `social-broker-redis` | Mensageria e sincronização de eventos de disparo | `6385` |
| **Backend API** | `social-publisher-api` | API REST para upload, autenticação, logs e publicação | `8005` |
| **Worker Agendador** | `social-scheduler-worker` | Daemon que monitora o agendamento e executa os envios | - |
| **Frontend Web** | `social-stream-web` | Interface do usuário em React / Nginx | `3005` |

---

## ⚡ Principais Funcionalidades

1. **Publicação Multi-Redes Automática:**
   - **Instagram Reels:** Criação de container e publicação automática com geração de link público via Backblaze B2.
   - **YouTube:** Suporte nativo tanto para **Vídeos Longos (16:9 tradicional)** quanto para **Shorts (9:16 vertical)**, incluindo seleção de tela final de vídeos longos publicados.
   - **TikTok:** Integração com Content Posting API.
2. **Gestão de Usuários & Convites:**
   - Controle de permissões (Administrador / Operador), convites com prazo de expiração e reset de senha via e-mail transacional (Brevo).
3. **Gestão de Logs Docker em Tempo Real:**
   - Monitoramento visual centralizado dos logs dos contêineres Docker (Worker, API, Banco, etc.) diretamente pelo painel.
4. **Backup Automático & Armazenamento em Nuvem:**
   - Rotina automatizada de dumps PostgreSQL com sincronização direta no bucket do **Backblaze B2** e política de retenção configurável.

---

## 🐳 Como Executar Localmente

### 1. Iniciar os Contêineres
```bash
docker compose -f docker/docker-compose-local.yml up -d
```

### 2. Acessar os Serviços
- **Frontend (Interface Web):** [http://localhost:3005](http://localhost:3005)
- **Backend (Swagger / OpenAPI):** [http://localhost:8005/docs](http://localhost:8005/docs)
- **Healthcheck:** [http://localhost:8005/api/health](http://localhost:8005/api/health)

---

## 🧪 Testes Unitários

- **Backend (Pytest):** 84 testes cobrindo autenticação, usuários, agendamento, publishers, B2 backup e worker (`docker exec social-publisher-api pytest tests`).
- **Frontend (Vitest + React Testing Library):** 166 testes cobrindo navegação, abas, modais, validação de formulários e estados de loading (`npm test -- --run` na pasta `frontend`).

---

## 🔒 Variáveis de Ambiente (`backend/.env.example`)

Copie o modelo de ambiente antes de iniciar:
```bash
cp backend/.env.example backend/.env
```
Preencha suas credenciais oficiais do Instagram (Meta Graph API), YouTube (Google OAuth), TikTok Developer e Backblaze B2.
