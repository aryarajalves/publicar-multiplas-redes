# 📖 Regras de Negócio do Sistema (MultiPost)

Este documento centraliza as diretrizes de negócio, permissões, autenticação, integrações e comportamentos esperados da plataforma MultiPost.

---

## 1. 👥 Gestão de Usuários e Autenticação

### 1.1. Super Admin
- **Unicidade:** O Super Admin é a conta raiz do sistema, inicializada a partir das variáveis de ambiente (`SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`).
- **Imutabilidade e Proteção:**
  - O Super Admin **não pode ser excluído**.
  - O Super Admin **não pode ter seu perfil alterado** por outros usuários.
  - Não é permitido criar outros Super Admins; a geração de convites permite exclusivamente perfis `admin` ou `editor`.

### 1.2. Papéis e Permissões
- `admin`: Possui acesso completo ao painel de publicações, gestão de contas conectadas, geração de convites e gerenciamento de membros.
- `editor`: Focado na criação, agendamento e acompanhamento de publicações e métricas.

---

## 2. ✉️ Convites e Cadastro de Membros

### 2.1. Geração de Links de Convite
- Apenas usuários com permissão de administrador podem emitir links de convite.
- Parâmetros configuráveis:
  - **Função:** Administrador (`admin`) ou Usuário (`editor`).
  - **Tempo de Expiração:** 1 hora, 6 horas, 24 horas, 48 horas ou 7 dias.
- **Uso Único:** Cada token é de uso estrito e é invalidado imediatamente após a conclusão do cadastro (`is_used = true`).

### 2.2. Unicidade de E-mail
- **Regra Rígida:** Não é permitido o cadastro de contas com e-mails já existentes no banco de dados.
- A validação ocorre em duas etapas:
  1. No momento da solicitação do código OTP (impede envio desnecessário de e-mails para contas já registradas).
  2. No momento da submissão final do cadastro.

### 2.3. Acompanhamento de Convites Gerados (Subaba na Gestão de Usuários)
- A tela de Gestão de Usuários dispõe de duas subabas: **Usuários Cadastrados** e **Convites Gerados**.
- Na aba de convites, o sistema classifica e filtra os links em três categorias obrigatórias:
  - **Faltam Expirar (Ativos/Pendentes):** Links não utilizados cuja data de validade ainda não foi atingida (`!is_used && expires_at > now`).
  - **Utilizados (Usados):** Links já consumidos para criação de conta (`is_used = true`), identificando o e-mail do membro e data de uso.
  - **Expirados:** Links cujo prazo de expiração se esgotou sem que tenham sido utilizados (`!is_used && expires_at <= now`).
- Administradores podem copiar o link direto ou revogar/excluir qualquer convite através de modal de confirmação dedicado (`DELETE /api/invitations/{id}`).

---

## 3. 🔐 Criptografia e Política de Senha

### 3.1. Requisitos de Complexidade de Senha
- Comprimento mínimo de **12 caracteres**.
- Pelo menos **1 letra maiúscula** (A-Z).
- Pelo menos **1 letra minúscula** (a-z).
- Pelo menos **1 número** (0-9).
- Pelo menos **1 caractere especial** (`!@#$%^&*()_+\-=\[\]{}|;:,.<>?`).

### 3.2. Criptografia com Argon2 (Argon2id)
- As senhas são armazenadas utilizando o algoritmo **Argon2id** com custo de memória RAM (*memory-hard*):
  - `memory_cost = 65536` KiB (64 MB de memória RAM dedicada por operação de derivação).
  - `time_cost = 3` iterações.
  - `parallelism = 4` threads concorrentes.
- Protege a infraestrutura contra ataques de força bruta acelerados por GPU/ASIC.
- Suporte retroativo e migratório transparente para hashes legados PBKDF2.

---

## 4. 📬 Validação de E-mail via Brevo (Sendinblue) e Fluxo em Duas Etapas

### 4.1. Fluxo em Duas Etapas (Two-Step Registration)
- **Painel 1 (Dados Cadastrais):**
  - O usuário preenche Nome, E-mail, WhatsApp, Senha e Confirmação de Senha.
  - **Não existe botão lateral de 'Validar E-mail'**. O formulário é preenchido de forma limpa.
  - Ao clicar no botão principal **'Criar Conta'**, o sistema valida as credenciais, verifica duplicidade de e-mail e dispara o código OTP de 6 dígitos via API do Brevo.
  - Havendo sucesso no envio, o usuário é automaticamente transicionado para o **Painel 2**.
- **Painel 2 (Confirmação do Código OTP):**
  - Tela dedicada que exibe o e-mail destinatário, o campo para os 6 dígitos numéricos, botão de reenvio com contagem regressiva de 60s e link de retorno para correção de dados.
  - **A conta só é criada e ativada no banco de dados após a confirmação válida do código OTP** via endpoint `POST /api/invitations/{token}/register`.

### 4.2. Conectividade e Diagnóstico do Brevo
- Se a variável de ambiente `BREVO_API_KEY` não estiver preenchida no arquivo `.env` do backend:
  - O endpoint `GET /api/invitations/{token}` informa `email_service_configured: false`.
  - A tela de cadastro exibe um banner preventivo amarelo avisando que o Brevo não está conectado.
  - Ao tentar submeter o cadastro para envio do OTP, a API recusa com `HTTP 400` e mensagem explícita: `"O serviço de e-mail (Brevo) não está conectado. A chave 'BREVO_API_KEY' não foi configurada no arquivo .env do servidor."`.
  - O frontend exibe essa mensagem de erro detalhada em destaque no formulário sem transicionar para o painel de OTP.

---

## 5. 🎨 Interface e Experiência do Usuário (Design System)

### 5.1. Banner Superior (Navbar)
- A Navbar com resumo de métricas e botão "+ Agendar Novo Vídeo" é exibida **apenas** na aba de **Publicações**.
- Na aba de **Gestão de Usuários**, o banner é **oculto**, priorizando a visualização limpa e focada da listagem e convites.

### 5.2. Prevenção de Autofill Indesejado
- A tela de cadastro por convite implementa técnicas estritas de neutralização de preenchimento automático de senhas pelo navegador (campos falsos transparentes, atributos de controle e sobrescrita de box-shadow).

### 5.3. Subabas na Gestão de Usuários
- Navegação fluida entre `Usuários Cadastrados (N)` e `Convites Gerados`, com contadores em tempo real e atualização automática após emissão de novos links.

### 5.4. Popups de Confirmação
- Exclusão de postagens, revogação de convites, encerramento de sessão (Logout) e publicação imediata de conteúdo (**'Publicar Agora'**) utilizam modais centralizados com backdrop translúcido que não fecham ao clicar fora, garantindo previsibilidade e segurança contra cliques acidentais.
- O popup de confirmação do **'Publicar Agora'** resume o título do vídeo e as badges de todas as redes de destino ativas antes de disparar o processamento.

### 5.5. Entrada de Telefone/WhatsApp com DDI Internacional
- O campo de WhatsApp possui seleção de DDI com a bandeira do Brasil (`🇧🇷 +55`) pré-configurada por padrão.
- O dropdown integrado permite buscar e selecionar DDIs de dezenas de países (ex: EUA, Portugal, Espanha, etc.).
- Formatação automática para números brasileiros (`(XX) XXXXX-XXXX`), com proteção contra duplicação de DDI caso o usuário cole o número já contendo o código do país.

---

## 6. 🎬 Captura de Frame do Vídeo e Escolha de Capas por Rede Social

### 6.1. Captura de Frame no Player (Opção A)
- O player de vídeo no modal de agendamento (`1. Mídia`) disponibiliza o botão `"📸 Capturar Frame Atual"`.
- Ao pausar o vídeo e clicar no botão, o frame atual do elemento `<video>` é extraído via `<canvas>` em resolução total e convertido em arquivo de imagem JPEG com preview instantâneo e timestamp formatado (`MM:SS`).
- O usuário dispõe de ações rápidas para:
  - **Descartar Frame:** Remove o frame temporário e restaura a seleção anterior.
  - **Capa Vertical (9:16):** Aplica diretamente o frame capturado como thumbnail vertical padrão.
  - **Capa 16:9:** Aplica diretamente o frame capturado como thumbnail horizontal para YouTube.

### 6.2. Escolha Granular de Origem de Capa por Rede Social
- Na aba `2. Personalização das Redes`, cada rede selecionada (YouTube, Instagram e TikTok) possui seu próprio seletor visual independente com 3 opções:
  1. **Frame do Vídeo:** Utiliza o frame capturado no player do vídeo.
  2. **Thumbnail Enviada:** Utiliza a imagem enviada por upload (respeitando formato 16:9 para YouTube ou 9:16 para Instagram/TikTok).
  3. **Padrão da Rede:** Não anexa imagem customizada para aquela rede, permitindo que a plataforma (YouTube, Instagram ou TikTok) selecione seu frame nativo automaticamente.
- A resolução de capas no envio garante que cada rede receba exatamente o arquivo correspondente à sua escolha, mantendo compatibilidade total com o backend e fluxos retroativos.

---

## 7. 🎵 Catálogo de Músicas do Instagram e Reels de Teste (Trial Reels)

### 7.1. Exibição de Perfis, Seguidores e Inscritos no Topo Direito (Navbar)
- Na parte superior direita da interface (Navbar), o sistema exibe os badges integrados das três redes sociais em tempo real:
  - 📸 **Instagram:** Exibe o `@username` conectado (ex: `@focoauto.aryaraj`) e a contagem atual de seguidores consultada na Meta Graph API (`GET /api/instagram/profile` ou `GET /api/platforms/profiles`).
  - 🔴 **YouTube:** Exibe o handle customizado do canal (ex: `@aryarajtechinfo` ou título) e a contagem de inscritos em tempo real consultada na Google Data API v3 (`GET /api/youtube/profile` ou `GET /api/platforms/profiles`).
  - 🎵 **TikTok:** Exibe o `@username` e contagem de seguidores quando conectado via OAuth/Token (`GET /api/tiktok/profile` ou `GET /api/platforms/profiles`). Quando não conectado, exibe o badge informativo com atalho direto para conectar a conta no modal de Contas.
- O endpoint consolidado `GET /api/platforms/profiles` retorna todos os perfis com cache em memória de 60 segundos para evitar esgotamento de cotas de requisição externa.

### 7.2. Reels de Teste (Trial Reels) e Restrição de 1.000 Seguidores
- O recurso **Reels de Teste (`trial_params`)** permite publicar um Reel visível inicialmente apenas para **não-seguidores**, com duas estratégias de graduação (`graduation_strategy`):
  - `MANUAL`: Compartilhar manualmente com seguidores.
  - `SS_PERFORMANCE`: Compartilhar automaticamente com seguidores se tiver bom desempenho nas primeiras 72h.
- **Regra de Elegibilidade Obrigatória:** Para ativar o Reels de Teste, a conta do Instagram deve possuir **pelo menos 1.000 seguidores** (`followers_count >= 1000`). Caso a conta possua menos de 1.000 seguidores, a interface exibe um aviso explícito informando a restrição e bloqueia a ativação até atingir o requisito.

### 7.3. Escolha de Música do Catálogo do Instagram (`/ig_audio`)
- Na aba do Instagram Reels, o usuário pode listar músicas em alta (*Trending*) ou pesquisar por nome da música/artista (`GET /api/instagram/audio`, categorias `music` e `original_sound`).
- Permite ouvir prévia de áudio, selecionar uma faixa para o Reel e ajustar independentemente:
  - **Volume da Música do Instagram:** `1%` a `100%` (`audio_volume`).
  - **Volume do Áudio Original do Vídeo:** `1%` a `100%` (`video_volume`).

---

## 8. 📊 Métricas de Engajamento dos Posts (Curtidas, Comentários, Compartilhamentos, Salvamentos e Visualizações)

### 8.1. Exibição Direta nos Cards de Post e Detalhes
- Para todas as publicações já realizadas (`status = 'published'`), o sistema exibe tanto no card da listagem principal (`PostCard.tsx`) quanto no modal de detalhes (`PostDetailsModal.tsx` e `PlatformPublicationTab.tsx`) os 5 indicadores-chave de engajamento:
  - ❤️ **Curtidas (`likes` / `like_count`)**
  - 💬 **Comentários (`comments` / `comments_count`)**
  - 🔄 **Compartilhamentos (`shares` via Meta Insights)**
  - 🔖 **Salvamentos (`saves` / `saved` via Meta Insights)**
  - 👁️ **Visualizações (`views` / `plays` via Meta Insights)**

### 8.2. Sincronização Sob Demanda e em Tempo Real
- O usuário dispõe do botão interativo **"Atualizar Métricas"** (`POST /api/analytics/posts/{post_id}/sync`) tanto no card de resumo consolidado quanto nas abas de cada rede social para forçar a coleta atualizada dos números diretamente na Meta Graph API v22.0.
- As métricas são gravadas na tabela `post_metric_snapshots` e consolidadas nas colunas `last_likes`, `last_comments`, `last_shares`, `last_saves`, `last_views` de `platform_publications` e expostas como propriedades computadas totais no modelo `Post`.

---

## 9. 💬 Moderação e Resposta a Comentários (Instagram Reels & YouTube Shorts)

### 9.1. Leitura e Resposta Direta pelo Dashboard
- No modal de detalhes de publicações já publicadas (`PostDetailsModal.tsx` / `PlatformPublicationTab.tsx`), o sistema disponibiliza uma seção completa de **Comentários & Respostas**.
- O usuário pode visualizar comentários de primeiro nível e respostas aninhadas de cada publicação no Instagram e no YouTube.
- O usuário pode enviar respostas diretamente para qualquer comentário específico ou adicionar um novo comentário raiz no vídeo/post.

### 9.2. Escopos de Permissão de APIs Externas
- **Instagram (Meta Graph API v22.0):** Requer a permissão `instagram_manage_comments` no Page Access Token. O endpoint utiliza `GET /{media_id}/comments` e `POST /{comment_id}/replies`.
- **YouTube (Google Data API v3):** Requer o escopo `https://www.googleapis.com/auth/youtube.force-ssl` no token OAuth. O endpoint utiliza `commentThreads.list` e `comments.insert`.
- Se a conta não tiver a permissão concedida, o sistema exibe um banner explicativo amigável em português orientando a renovar o token com os escopos correspondentes sem causar travamento na interface.

---

## 10. 🌐 Botão Unificado de Redes Sociais no Topo Direito (Navbar)

### 10.1. Dropdown Interativo de Perfis e Seguidores
- Os botões separados das redes sociais no topo direito foram consolidados em um único componente interativo com design glassmorphism (`SocialProfilesDropdown.tsx`).
- O botão principal exibe os ícones coloridos das redes conectadas e o total somado de seguidores/inscritos.
- Ao clicar, exibe um popover elegante com os dados detalhados de cada rede:
  - 📸 **Instagram:** `@username`, seguidores e atalho para abrir o perfil.
  - 🔴 **YouTube:** `@handle` ou nome do canal, inscritos e atalho direto.
  - 🎵 **TikTok:** `@username`, seguidores ou status de conexão.

---

## 11. ❓ Perguntas de Negócio e Decisões Futuras

*(Nenhuma pergunta em aberto no momento — todos os requisitos de moderação de comentários, unificação de badges sociais e métricas foram plenamente implementados e testados)*

