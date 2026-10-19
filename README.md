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
| **Banco de Dados** | `social-vault-postgres` | Armazena posts, usuários, agendamentos e histórico | `7543` |
| **Backend API** | `social-publisher-api` | API REST para upload, autenticação, logs e publicação | `7800` |
| **Worker Agendador** | `social-scheduler-worker` | Daemon que monitora o agendamento e executa os envios | - |
| **Frontend Web** | `social-stream-web` | Interface do usuário em React / Nginx | `7300` |

### Ambiente de Produção (`docker/docker-compose-producao.yml`)
Em produção, os 3 serviços utilizam imagens versionadas no Docker Hub, conectam-se à rede única do Swarm `network_swarm_public` e compartilham o volume nomeado `social_stream_uploads` para persistência de mídias:
| Serviço | Nome do Contêiner | Imagem Docker Hub | Função | Porta no Host |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `social-stream-backend` | `aryalvesfernandes/publica-multiplas-redes:backend-1.0.0` | API REST FastAPI de produção | `7800` |
| **Worker Agendador** | `social-stream-worker` | `aryalvesfernandes/publica-multiplas-redes:backend-1.0.0` | Daemon de agendamento e publicação assíncrona | - |
| **Frontend Web** | `social-stream-frontend` | `aryalvesfernandes/publica-multiplas-redes:frontend-1.0.0` | Servidor Nginx servindo o bundle compilado em produção | `7300` |

- **Rede Única:** `network_swarm_public` (externa)
- **Volume Nomeado:** `social_stream_uploads` (compartilhado entre backend e worker)

---

## ⚡ Principais Funcionalidades

1. **Publicação Multi-Redes Automática:**
   - **Instagram Reels:** Criação de container e publicação automática com geração de link público via Backblaze B2, suporte a músicas do catálogo oficial com ajuste independente de volume de áudio e música, e suporte a Reels de Teste (Trial Reels).
   - **YouTube:** Suporte nativo tanto para **Vídeos Longos (16:9 tradicional)** quanto para **Shorts (9:16 vertical)**, incluindo seleção de tela final de vídeos longos publicados.
   - **TikTok:** Integração com Content Posting API oficial e autenticação OAuth 2.0 com **PKCE (`code_challenge` S256)** e exibição da **Redirect URI** diretamente na interface para cópia rápida.
2. **Moderação e Resposta a Comentários (Instagram Reels & YouTube Shorts):**
   - Leitura de comentários e respostas aninhadas diretamente no modal de detalhes de qualquer vídeo publicado.
   - Respostas inline enviadas pelo próprio dashboard para o Instagram e YouTube com tratamento inteligente de permissões.
3. **Métricas de Engajamento em Tempo Real:**
   - Acompanhamento de **Curtidas, Comentários, Compartilhamentos, Salvamentos e Visualizações** tanto nos cards quanto no modal com sincronização sob demanda via Meta Graph API v22.0.
4. **Botão Unificado de Redes Sociais no Topo Direito (Navbar):**
   - Dropdown interativo consolidando contagem de seguidores, canais conectados e links diretos para perfis de Instagram, YouTube e TikTok.
5. **Calendário de Agendamento:**
   - Visualização mensal e semanal intuitiva para acompanhamento dos posts agendados e publicados com status coloridos.
6. **Configurações Gerais do Sistema:**
   - Gestão de dados corporativos, timezone, endereço completo com busca via OpenStreetMap e preferências persistidas no PostgreSQL.
7. **Design System Vturb / SmartVSL:**
   - Interface limpa em Light Mode (`bg-slate-50`), painéis em branco puro (`bg-white`), tipografia de alto contraste e botão de ação primária em vermelho Coral Vturb (`#ea384c`).
8. **Gestão de Usuários & Convites:**
   - Controle de permissões (Administrador / Operador), convites com prazo de expiração e filtros visuais (Faltam Expirar, Utilizados e Expirados).
9. **Gestão de Logs Docker em Tempo Real:**
   - Monitoramento visual centralizado dos logs dos contêineres Docker (Worker, API, Banco, etc.) diretamente pelo painel.
10. **Backup Automático & Armazenamento em Nuvem:**
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
- **Frontend (Interface Web):** [http://localhost:7300](http://localhost:7300)
- **Backend (Swagger / OpenAPI):** [http://localhost:7800/docs](http://localhost:7800/docs)
- **Healthcheck:** [http://localhost:7800/api/health](http://localhost:7800/api/health)

---

## 🧪 Testes Unitários

- **Backend (Pytest):** 119 testes cobrindo autenticação, usuários, agendamento, comentários, analytics, publishers, B2 backup e worker (`docker exec social-publisher-api pytest tests`).
- **Frontend (Vitest + React Testing Library):** 220 testes em 35 suítes cobrindo comentários, navegação, dropdown de perfis, abas, modais, validação de formulários e estados de loading (`npm test -- --run` na pasta `frontend`).

---

## 🔒 Variáveis de Ambiente (`backend/.env.example`)

Copie o modelo de ambiente antes de iniciar:
```bash
cp backend/.env.example backend/.env
```
Preencha suas credenciais oficiais do Instagram (Meta Graph API), YouTube (Google OAuth), TikTok Developer e Backblaze B2.
