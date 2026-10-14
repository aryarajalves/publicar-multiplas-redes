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
- Exclusão de postagens, revogação de convites e encerramento de sessão (Logout) utilizam modais centralizados com backdrop translúcido que não fecham ao clicar fora, garantindo previsibilidade e segurança contra cliques acidentais.

### 5.5. Entrada de Telefone/WhatsApp com DDI Internacional
- O campo de WhatsApp possui seleção de DDI com a bandeira do Brasil (`🇧🇷 +55`) pré-configurada por padrão.
- O dropdown integrado permite buscar e selecionar DDIs de dezenas de países (ex: EUA, Portugal, Espanha, etc.).
- Formatação automática para números brasileiros (`(XX) XXXXX-XXXX`), com proteção contra duplicação de DDI caso o usuário cole o número já contendo o código do país.

---

## 6. ❓ Perguntas de Negócio e Decisões Futuras

*(Nenhuma pergunta em aberto no momento — todos os requisitos de gestão de convites, filtros de expiração e fluxo em dois painéis foram esclarecidos e implementados)*
