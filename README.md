# 🎬 MultiPost (Publicar Múltiplas Redes)

Plataforma completa para upload, agendamento e publicação automática de vídeos simultaneamente no **Instagram Reels**, **YouTube (Vídeos Longos e Shorts)** e **TikTok**, com painel analítico, gestão de logs em tempo real e backup automatizado em nuvem via **Backblaze B2**.

---

## 🚀 Arquitetura & Tecnologias

- **Backend:** Python 3.12 (FastAPI, SQLAlchemy 2.0, Pydantic V2, Uvicorn)
- **Frontend:** React 18 (Vite, TypeScript, Tailwind CSS, Lucide Icons, Design System Vturb / SmartVSL em Light Mode)
- **Banco de Dados:** PostgreSQL 16 (`social-vault-postgres`)
- **Worker de Agendamento:** Python Scheduler Daemon assíncrono (`social-scheduler-worker`)
- **Armazenamento em Nuvem:** Backblaze B2 / S3 Storage (Backups e entrega de mídia pública para Meta/Instagram)
- **Servidor Web / Proxy:** Nginx servindo o bundle compilado em produção
- **Containerização:** Docker & Docker Compose (`docker-compose-local.yml` para desenvolvimento e `docker-compose-producao.yml` para produção)

---

## 🏷️ Estrutura de Contêineres Docker

### Ambiente Local (`docker/docker-compose-local.yml`)
| Serviço | Nome do Contêiner | Função | Porta no Host |
| :--- | :--- | :--- | :--- |
| **Banco de Dados** | `social-vault-postgres` | Armazena posts, usuários, agendamentos e histórico | `5438` |
| **Backend API** | `social-publisher-api` | API REST para upload, autenticação, logs e publicação | `8005` |
| **Worker Agendador** | `social-scheduler-worker` | Daemon que monitora o agendamento e executa os envios | - |
| **Frontend Web** | `social-stream-web` | Interface do usuário em React / Nginx | `3005` |

### Ambiente de Produção (`docker/docker-compose-producao.yml`)
Em produção, os 3 serviços utilizam imagens versionadas no Docker Hub, conectam-se à rede única do Swarm `network_swarm_public` e compartilham o volume nomeado `social_stream_uploads` para persistência de mídias:
| Serviço | Nome do Contêiner | Imagem Docker Hub | Função | Porta no Host |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `social-stream-backend` | `aryalvesfernandes/publica-multiplas-redes:backend-1.0.0` | API REST FastAPI de produção | `8005` |
| **Worker Agendador** | `social-stream-worker` | `aryalvesfernandes/publica-multiplas-redes:backend-1.0.0` | Daemon de agendamento e publicação assíncrona | - |
| **Frontend Web** | `social-stream-frontend` | `aryalvesfernandes/publica-multiplas-redes:frontend-1.0.0` | Servidor Nginx servindo o bundle compilado em produção | `3005` |

- **Rede Única:** `network_swarm_public` (externa)
- **Volume Nomeado:** `social_stream_uploads` (compartilhado entre backend e worker)

---

## ⚡ Principais Funcionalidades

1. **Publicação Multi-Redes Automática:**
   - **Instagram Reels:** Criação de container e publicação automática com geração de link público via Backblaze B2.
   - **YouTube:** Suporte nativo tanto para **Vídeos Longos (16:9 tradicional)** quanto para **Shorts (9:16 vertical)**, incluindo seleção de tela final de vídeos longos publicados.
   - **TikTok:** Integração com Content Posting API oficial e autenticação OAuth 2.0 com **PKCE (`code_challenge` S256)** e exibição da **Redirect URI** diretamente na interface para cópia rápida.
2. **Design System Vturb / SmartVSL:**
   - Interface limpa em Light Mode (`bg-slate-50`), painéis em branco puro (`bg-white`), tipografia de alto contraste e botão de ação primária em vermelho Coral Vturb (`#ea384c`).
3. **Gestão de Usuários & Convites:**
   - Controle de permissões (Administrador / Operador), convites com prazo de expiração e reset de senha via e-mail transacional (Brevo).
4. **Gestão de Logs Docker em Tempo Real:**
   - Monitoramento visual centralizado dos logs dos contêineres Docker (Worker, API, Banco, etc.) diretamente pelo painel.
5. **Backup Automático & Armazenamento em Nuvem:**
   - Rotina automatizada de dumps PostgreSQL com sincronização direta no bucket do **Backblaze B2** e política de retenção configurável.

---

## 🐳 Como Executar

### Ambiente Local (Desenvolvimento com PostgreSQL embutido)
```bash
docker compose -f docker/docker-compose-local.yml up -d
```

### Ambiente de Produção (Serviços isolados com PostgreSQL do Servidor)
```bash
docker compose -f docker/docker-compose-producao.yml up -d
```

### Acessar os Serviços
- **Frontend (Interface Web):** [http://localhost:3005](http://localhost:3005)
- **Backend (Swagger / OpenAPI):** [http://localhost:8005/docs](http://localhost:8005/docs)
- **Healthcheck:** [http://localhost:8005/api/health](http://localhost:8005/api/health)

---

## 🧪 Testes Unitários

- **Backend (Pytest):** 84 testes cobrindo autenticação, usuários, agendamento, publishers, B2 backup e worker (`docker exec social-publisher-api pytest tests`).
- **Frontend (Vitest + React Testing Library):** 167 testes em 25 suítes cobrindo navegação, abas, modais, validação de formulários e estados de loading (`npm test -- --run` na pasta `frontend`).

---

## 🔒 Variáveis de Ambiente (`backend/.env.example`)

Copie o modelo de ambiente antes de iniciar:
```bash
cp backend/.env.example backend/.env
```
Preencha suas credenciais oficiais do Instagram (Meta Graph API), YouTube (Google OAuth), TikTok Developer e Backblaze B2.
