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
