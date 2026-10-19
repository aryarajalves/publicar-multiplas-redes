# 📊 Registro de Alterações no Banco de Dados (Schema Log)

Este arquivo documenta todas as alterações de esquema, novas tabelas e migrações aplicadas no banco de dados do projeto.

---

### [2026-10-13] Criação da Tabela `social_accounts`
- **Tabela afetada:** `social_accounts` (Nova)
- **Objetivo:** Armazenar dados e tokens das contas conectadas via OAuth (TikTok, YouTube, Instagram), viabilizando renovação automática de tokens via `refresh_token` e status de conexão no painel.
- **Colunas adicionadas:**
  - `id` (INTEGER PRIMARY KEY)
  - `platform` (VARCHAR(50) UNIQUE NOT NULL) — 'tiktok', 'youtube', 'instagram'
  - `account_id` (VARCHAR(255)) — open_id ou identificador de canal
  - `account_name` (VARCHAR(255)) — nome do perfil / @username
  - `avatar_url` (VARCHAR(500)) — URL do avatar
  - `access_token` (TEXT) — Token de acesso
  - `refresh_token` (TEXT) — Token de renovação (válido por até 365 dias)
  - `token_expires_at` (TIMESTAMPTZ) — Data de expiração do access token
  - `refresh_expires_at` (TIMESTAMPTZ) — Data de expiração do refresh token
  - `scopes` (VARCHAR(500)) — Escopos concedidos
  - `is_connected` (BOOLEAN NOT NULL DEFAULT TRUE) — Status ativo
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
  - `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_social_accounts_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:5432`)

---

### [2026-10-13] Criação da Tabela `users`
- **Tabela afetada:** `users` (Nova)
- **Objetivo:** Armazenar contas de usuários do sistema para autenticação, controle de acesso e futura tela de login.
- **Colunas adicionadas:**
  - `id` (INTEGER PRIMARY KEY)
  - `name` (VARCHAR(255) NOT NULL) — Nome do usuário
  - `email` (VARCHAR(255) UNIQUE NOT NULL) — E-mail de acesso
  - `hashed_password` (VARCHAR(500) NOT NULL) — Senha criptografada (PBKDF2/SHA256 com Salt)
  - `role` (VARCHAR(50) NOT NULL DEFAULT 'admin') — Perfil ('admin' ou 'editor')
  - `is_active` (BOOLEAN NOT NULL DEFAULT TRUE) — Status ativo/inativo
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
  - `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_users_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:5432`)

---

### [2026-10-13] Criação da Tabela `invitations` e Adição de `whatsapp` em `users`
- **Tabelas afetadas:** `invitations` (Nova) e `users` (Alterada)
- **Objetivo:** Viabilizar o sistema de geração de links de convite para cadastro de novos usuários com definição de função (Admin ou Usuário), tempo de expiração e dados de contato (WhatsApp).
- **Colunas adicionadas:**
  - Em `users`:
    - `whatsapp` (VARCHAR(50) NULLABLE) — Número de WhatsApp do usuário cadastrado
  - Em `invitations`:
    - `id` (INTEGER PRIMARY KEY)
    - `token` (VARCHAR(100) UNIQUE NOT NULL) — Token seguro e único para o link de convite
    - `role` (VARCHAR(50) NOT NULL DEFAULT 'editor') — Papel atribuído ('admin' ou 'editor')
    - `created_by_id` (INTEGER REFERENCES users(id) ON DELETE SET NULL) — Usuário gerador
    - `expires_at` (TIMESTAMPTZ NOT NULL) — Data/hora limite de validade do convite
    - `is_used` (BOOLEAN NOT NULL DEFAULT FALSE) — Flag indicando se o convite já foi utilizado
    - `used_by_email` (VARCHAR(255) NULLABLE) — E-mail do usuário que utilizou o convite
    - `used_at` (TIMESTAMPTZ NULLABLE) — Data/hora da utilização
    - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_invitations_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:5432`)

---

### [2026-10-13] Criação da Tabela `email_verifications`
- **Tabela afetada:** `email_verifications` (Nova)
- **Objetivo:** Armazenar códigos numéricos de verificação (OTP de 6 dígitos) disparados via API do Brevo para validação de e-mail antes do cadastro por link de convite.
- **Colunas adicionadas:**
  - `id` (INTEGER PRIMARY KEY)
  - `email` (VARCHAR(255) NOT NULL) — E-mail em processo de validação
  - `code` (VARCHAR(10) NOT NULL) — Código de 6 dígitos numéricos
  - `token` (VARCHAR(100) NOT NULL) — Token do convite associado
  - `expires_at` (TIMESTAMPTZ NOT NULL) — Validade do código (15 minutos)
  - `is_verified` (BOOLEAN NOT NULL DEFAULT FALSE) — Flag de verificação realizada
  - `verified_at` (TIMESTAMPTZ NULLABLE) — Timestamp da verificação
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_email_verifications_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:5432`)

---

### [2026-10-14] Criação da Tabela `password_reset_tokens`
- **Tabela afetada:** `password_reset_tokens` (Nova)
- **Objetivo:** Armazenar tokens únicos de redefinição de senha disparados via Brevo para permitir que o usuário crie uma nova senha de forma segura.
- **Colunas adicionadas:**
  - `id` (SERIAL PRIMARY KEY)
  - `user_id` (INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE) — Usuário alvo
  - `token` (VARCHAR(100) UNIQUE NOT NULL) — Token seguro de redefinição
  - `expires_at` (TIMESTAMPTZ NOT NULL) — Prazo de expiração (24 horas)
  - `is_used` (BOOLEAN NOT NULL DEFAULT FALSE) — Flag indicando se a senha já foi redefinida
  - `used_at` (TIMESTAMPTZ NULLABLE) — Timestamp do uso do token
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_password_reset_tokens_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:5432`)

---

### [2026-10-14] Criação das Tabelas de Backup Automático e Configuração (`backup_records` e `backup_schedule_settings`)
- **Tabelas afetadas:** `backup_records` (Nova) e `backup_schedule_settings` (Nova)
- **Objetivo:** Armazenar metadados dos dumps do banco de dados PostgreSQL (tamanho, tipo manual/automático/importado, chave S3 no Backblaze B2, data de criação) e parâmetros da rotina de agendamento automático periódico e política de retenção.
- **Colunas adicionadas:**
  - Em `backup_records`:
    - `id` (INTEGER PRIMARY KEY)
    - `filename` (VARCHAR(255) UNIQUE NOT NULL) — Nome do arquivo compactado (.dump.gz)
    - `file_size_bytes` (BIGINT NOT NULL DEFAULT 0) — Tamanho em bytes
    - `backup_type` (VARCHAR(50) NOT NULL DEFAULT 'manual') — 'automatic', 'manual' ou 'imported'
    - `s3_key` (VARCHAR(500) NULLABLE) — Chave/caminho no Backblaze B2 / S3
    - `local_path` (VARCHAR(500) NULLABLE) — Caminho em disco local / uploads
    - `status` (VARCHAR(50) NOT NULL DEFAULT 'completed') — 'completed', 'failed', 'in_progress'
    - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
  - Em `backup_schedule_settings`:
    - `id` (INTEGER PRIMARY KEY)
    - `is_active` (BOOLEAN NOT NULL DEFAULT TRUE) — Ativação da rotina periódica
    - `frequency_hours` (INTEGER NOT NULL DEFAULT 24) — Intervalo de execução (1, 6, 12, 24, 168)
    - `s3_folder` (VARCHAR(255) NOT NULL DEFAULT 'multipost/backups/') — Prefixo da pasta no bucket
    - `retention_limit` (INTEGER NOT NULL DEFAULT 30) — Limite máximo de backups antes da rotação
    - `last_backup_at` (TIMESTAMPTZ NULLABLE) — Timestamp da última execução
    - `next_backup_at` (TIMESTAMPTZ NULLABLE) — Timestamp da próxima execução prevista
    - `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_backup_tables.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:5432`)

---

### [2026-10-17] Criação da Tabela de Métricas e Colunas Consolidadas (`post_metric_snapshots` e `platform_publications`)
- **Tabelas afetadas:** `post_metric_snapshots` (Nova) e `platform_publications` (Alterada)
- **Objetivo:** Armazenar snapshots históricos de desempenho coletados das APIs oficiais (YouTube Analytics, Instagram Insights e TikTok Display API), viabilizando gráficos de evolução e diagnóstico de inteligência no painel de Analytics.
- **Colunas adicionadas:**
  - Na tabela `post_metric_snapshots` (Nova):
    - `id` (INTEGER PRIMARY KEY)
    - `post_id` (INTEGER FOREIGN KEY -> posts.id CASCADE)
    - `publication_id` (INTEGER FOREIGN KEY -> platform_publications.id CASCADE)
    - `platform` (VARCHAR(50) NOT NULL INDEX) — 'youtube', 'instagram', 'tiktok'
    - `views` (INTEGER NOT NULL DEFAULT 0) — Visualizações reais
    - `likes` (INTEGER NOT NULL DEFAULT 0) — Curtidas
    - `comments` (INTEGER NOT NULL DEFAULT 0) — Comentários
    - `shares` (INTEGER NOT NULL DEFAULT 0) — Compartilhamentos
    - `saves` (INTEGER NOT NULL DEFAULT 0) — Salvamentos (Instagram)
    - `reach` (INTEGER NOT NULL DEFAULT 0) — Alcance de contas únicas
    - `impressions` (INTEGER NOT NULL DEFAULT 0) — Impressões
    - `watch_time_seconds` (FLOAT NOT NULL DEFAULT 0.0) — Tempo total assistido
    - `retention_rate_pct` (FLOAT NOT NULL DEFAULT 0.0) — Taxa de retenção média %
    - `ctr_pct` (FLOAT NOT NULL DEFAULT 0.0) — Taxa de cliques da miniatura (YouTube)
    - `collected_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW() INDEX)
  - Na tabela `platform_publications` (Novas colunas para leitura rápida consolidada):
    - `last_views` (INTEGER NOT NULL DEFAULT 0)
    - `last_likes` (INTEGER NOT NULL DEFAULT 0)
    - `last_comments` (INTEGER NOT NULL DEFAULT 0)
    - `last_shares` (INTEGER NOT NULL DEFAULT 0)
    - `last_metrics_sync_at` (TIMESTAMPTZ NULLABLE)
- **Script de Migração:** `backend/scripts/create_metrics_tables.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:7543`)

---

### [2026-10-17] Criação da Tabela `publication_settings`
- **Tabela afetada:** `publication_settings` (Nova)
- **Objetivo:** Persistir as preferências globais de publicação do usuário, incluindo localização padrão para Instagram (Place ID da Meta), hashtags de localização para TikTok, nome da localidade no YouTube e toggle de aplicação automática.
- **Colunas adicionadas:**
  - `id` (INTEGER PRIMARY KEY)
  - `default_location_name` (VARCHAR(255) NULLABLE) — Nome legível da localidade/cidade
  - `default_location_id` (VARCHAR(100) NULLABLE) — Place ID oficial da Meta para o Instagram
  - `tiktok_location_hashtags` (VARCHAR(500) NULLABLE) — Hashtags automáticas de região para o TikTok
  - `youtube_location_name` (VARCHAR(255) NULLABLE) — Nome de localização para YouTube
  - `apply_location_to_all` (BOOLEAN NOT NULL DEFAULT TRUE) — Se aplica automaticamente em postagens
  - `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- **Script de Migração:** `backend/scripts/create_settings_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:7543`)


---

### [2026-10-19] Adição de Colunas de Música do Instagram e Reels de Teste (`Trial Reels`) na Tabela `posts`
- **Tabela afetada:** `posts`
- **Objetivo:** Permitir armazenar a música selecionada no catálogo da Instagram Audio API (`audio_id`, título, artista, volume da música e volume do vídeo) e a configuração de Reels de Teste (`trial_params` com `graduation_strategy` `MANUAL` ou `SS_PERFORMANCE`).
- **Colunas adicionadas:**
  - `instagram_audio_id` (VARCHAR(100) NULLABLE) — ID oficial da faixa de áudio na Meta Graph API (`/ig_audio`)
  - `instagram_audio_title` (VARCHAR(255) NULLABLE) — Título da música ou áudio selecionado
  - `instagram_audio_artist` (VARCHAR(255) NULLABLE) — Artista ou criador do áudio
  - `instagram_audio_volume` (INTEGER NULLABLE DEFAULT 100) — Volume da música do Instagram (1 a 100)
  - `instagram_video_volume` (INTEGER NULLABLE DEFAULT 100) — Volume do áudio original do vídeo (1 a 100)
  - `instagram_is_trial_reel` (BOOLEAN NOT NULL DEFAULT FALSE) — Define se o Reel será publicado como Reels de Teste (apenas não-seguidores)
  - `instagram_trial_graduation_strategy` (VARCHAR(50) NULLABLE DEFAULT 'MANUAL') — Estratégia de graduação do Reel de Teste (`MANUAL` ou `SS_PERFORMANCE`)
- **Script de Migração:** `backend/scripts/add_instagram_music_and_trial_columns.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:7543`)

---

### [2026-10-19] Criação da Tabela `instagram_favorite_audios` (Músicas Favoritas do Instagram)
- **Tabela afetada:** `instagram_favorite_audios` (Nova)
- **Objetivo:** Permitir que o usuário salve nos Favoritos (`⭐`) suas melhores músicas e áudios originais do Instagram para reutilização rápida em novas publicações de Reels.
- **Colunas adicionadas:**
  - `id` (SERIAL PRIMARY KEY)
  - `audio_id` (VARCHAR(100) UNIQUE NOT NULL) — ID oficial do áudio no Instagram
  - `title` (VARCHAR(255) NOT NULL) — Nome da música/áudio
  - `display_artist` (VARCHAR(255) NULLABLE) — Artista ou criador
  - `duration_in_ms` (INTEGER NOT NULL DEFAULT 0) — Duração em milissegundos
  - `audio_type` (VARCHAR(50) NOT NULL DEFAULT 'music') — `'music'` ou `'original_sound'`
  - `cover_artwork_thumbnail_uri` (VARCHAR(1000) NULLABLE) — URL da capa do álbum
  - `download_url` (VARCHAR(1000) NULLABLE) — URL de prévia de áudio
  - `on_platform_audio_preview_link` (VARCHAR(1000) NULLABLE) — Link oficial no Instagram Reels
  - `ig_username` (VARCHAR(255) NULLABLE) — `@username` do criador quando disponível
  - `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)
- **Script de Migração:** `backend/scripts/add_instagram_favorite_audios_table.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:7543`)

---

### [2026-10-19] Adição da Coluna `last_saves` na Tabela `platform_publications`
- **Tabela afetada:** `platform_publications`
- **Objetivo:** Armazenar a contagem consolidada de salvamentos (`saves`) de cada postagem nas redes sociais (especialmente Instagram Reels), permitindo visualização ágil das métricas de curtidas, comentários, compartilhamentos e salvamentos.
- **Colunas adicionadas:**
  - `last_saves` (INTEGER NOT NULL DEFAULT 0) — Contagem consolidada de salvamentos do post
- **Script de Migração:** `backend/scripts/add_last_saves_to_platform_publications.py`
- **Ambiente de Aplicação:** PostgreSQL local (`social-vault-postgres:7543`)

