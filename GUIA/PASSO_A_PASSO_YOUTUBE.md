# 📘 Guia Passo a Passo: Integração da API do YouTube (Shorts e Vídeos Longos)

Este guia documenta todo o processo realizado para configurar o **Google Cloud Console**, autorizar o seu canal do YouTube e extrair todas as credenciais necessárias (`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` e `YOUTUBE_REFRESH_TOKEN`) para colocar no arquivo `.env` do sistema.

---

## 🎯 Objetivo
Configurar a **YouTube Data API v3** com OAuth 2.0 para permitir que o sistema faça uploads automatizados e agendados de vídeos diretamente no seu canal do YouTube, sem intervenção manual e sem expirar o token de acesso.

---

## 📋 Credenciais Necessárias no `.env`

No arquivo `backend/.env`, as seguintes variáveis são preenchidas:

```env
# YOUTUBE (DATA API v3 - SHORTS & VÍDEOS LONGOS)
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-seu_client_secret
YOUTUBE_REFRESH_TOKEN=1//04seu_refresh_token_aqui
```

---

## 🚀 Passo a Passo Completo

### Passo 1: Criar o Projeto no Google Cloud
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) logado na mesma conta Google (Gmail) dona ou administradora do canal do YouTube.
2. No topo da tela, clique no seletor de projetos e clique em **"Novo Projeto"**.
3. Dê um nome ao projeto (exemplo: `Aryaraj - Canal Youtube` ou `Publicador YouTube`).
4. Clique em **Criar** e selecione o projeto recém-criado.

---

### Passo 2: Ativar a YouTube Data API v3
1. No menu lateral ou na barra de busca superior, pesquise por **YouTube Data API v3**.
2. Clique sobre ela nos resultados.
3. Clique no botão azul **"Ativar"** (Enable).

---

### Passo 3: Configurar a Tela de Permissão OAuth (Google Auth Platform)
1. No menu lateral esquerdo, vá em **"APIs e serviços"** > **"Tela de permissão OAuth"** (ou na nova interface: **Google Auth Platform** > clique em **"Vamos começar"**).
2. **Público (User Type):**
   * Selecione **"Externo"** (External).
   * Clique em **Avançar / Criar**.
   * *(Nota: O modo "Interno" só existe para contas corporativas pagas do Google Workspace. Para canais do YouTube e contas Gmail normais, sempre usamos "Externo" em modo de teste).*
3. **Informações do Aplicativo:**
   * **Nome do app:** `Publicador YouTube`
   * **E-mail de suporte:** Selecione o seu próprio e-mail do Gmail.
   * **Dados de contato do desenvolvedor:** Digite o seu mesmo e-mail.
   * Clique em **Salvar e continuar**.
4. **Escopos (Scopes):**
   * Clique no botão **"Adicionar ou remover escopos"**.
   * Filtre por YouTube e marque a permissão obrigatória de upload:
     * `https://www.googleapis.com/auth/youtube.upload`
   * Clique em **Atualizar** e depois em **Salvar e continuar**.
5. **Usuários de Teste (Test Users) — ⚠️ PASSO CRÍTICO:**
   * Clique em **"+ Adicionar usuários"** (+ Add users).
   * Digite o **mesmo e-mail do Gmail** dono/administrador do canal (ex: `seuemail@gmail.com`).
   * Clique em **Salvar / Adicionar**.
   * *(Sem esse passo, o Google bloqueia o login com o Erro 403: access_denied).*
   * Clique em **Salvar e continuar** até concluir.

---

### Passo 4: Criar as Credenciais OAuth 2.0 (Client ID e Client Secret)
1. No menu lateral, clique em **"Credenciais"** (ícone da chavinha).
2. No topo da tela, clique em **"+ Criar credenciais"** > **"ID do cliente OAuth"** (ou no botão **"Criar um cliente OAuth"**).
3. **Tipo de aplicativo:** Selecione **"Aplicativo da Web"** (Web application).
4. **Nome:** Pode manter o padrão ou digitar `Cliente da Web 1`.
5. **URIs de redirecionamento autorizados (Authorized redirect URIs):**
   * Role a tela até esse campo e clique em **"+ Adicionar URI"**.
   * Cole esta URL exata da ferramenta oficial do Google:
     ```text
     https://developers.google.com/oauthplayground
     ```
6. Clique no botão azul **"Criar"** no final da página.
7. O Google exibirá a janela **"Cliente OAuth criado"** contendo:
   * **ID do cliente** (`Client ID`)
   * **Chave secreta do cliente** (`Client Secret`)
8. Clique no botão de download (setinha para baixo ⬇️) para baixar o arquivo JSON com as credenciais (ex: `client_secret_...json`). Esse arquivo contém o segredo exato sem risco de confundir letras maiúsculas/minúsculas.

---

### Passo 5: Gerar o `Refresh Token` no Google OAuth 2.0 Playground
O Google Playground é a ferramenta oficial para autorizar o seu canal e emitir um token de longa duração que nunca expira:

1. Acesse o [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. No canto superior direito, clique no ícone da **Engrenagem** (⚙️):
   * Marque a caixinha: ☑️ **Use your own OAuth credentials**.
   * No campo **OAuth Client ID**, cole o seu `Client ID`.
   * No campo **OAuth Client secret**, cole o seu `Client Secret` exato (copiado diretamente do arquivo JSON baixado).
   * Clique em **Close**.
3. Na coluna esquerda (**Step 1: Select & authorize APIs**):
   * Role para baixo até encontrar **YouTube Data API v3**.
   * Expanda a lista e marque:
     * ☑️ `https://www.googleapis.com/auth/youtube.upload`
   * Clique no botão azul **"Authorize APIs"**.
4. **Tela de Login e Seleção do Canal:**
   * Faça login com a sua conta Google cadastrada nos usuários de teste.
   * **Aqui você escolhe o seu canal:** O Google listará os seus canais do YouTube. Clique no canal desejado.
   * Se aparecer o aviso *"O Google não verificou este app"*, clique em **Avançado** > **Acessar Publicador YouTube (não seguro)** > **Continuar**.
5. O Playground avançará automaticamente para o **Step 2**:
   * O campo **Authorization code** estará preenchido.
   * Clique no botão azul: **"Exchange authorization code for tokens"**.
   * O Google responderá com status `HTTP/1.1 200 OK`!
6. O campo **`Refresh token`** na caixinha da esquerda será preenchido (código começando com `1//04...`).
7. Copie o valor do **`Refresh token`**!

---

### Passo 6: Configurar no arquivo `.env` do Projeto
Abra o arquivo `backend/.env` e cole os valores obtidos:

```env
# YOUTUBE (DATA API v3 - SHORTS)
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=seu_client_secret_aqui
YOUTUBE_REFRESH_TOKEN=seu_refresh_token_aqui
```

Para publicar ao vivo em vez de simular, certifique-se de configurar:
```env
SIMULATE_PUBLICATIONS=false
```

---

## 🛠️ Problemas Comuns e Como Foram Resolvidos

### 1. Erro 403: `access_denied` ao tentar logar
* **Causa:** O aplicativo no Google Cloud está em modo "Externo" (Modo de Testes) e o e-mail que tentou logar não estava cadastrado.
* **Solução:** No Google Cloud Console, ir em **Google Auth Platform** > **Público** (ou **Tela de permissão OAuth** > **Usuários de teste**), clicar em **"+ Adicionar usuários"**, digitar o e-mail do Gmail e salvar.

### 2. Erro 401: `"The provided client secret is invalid."` no OAuth Playground
* **Causa:** Erro sutil de digitação na chave secreta (por exemplo, confundir a letra `l` minúscula com `I` maiúsculo, como no trecho `MIief` vs `Mlief`), ou espaço em branco copiado no início/fim.
* **Solução:** Baixar o arquivo JSON das credenciais direto do Google Cloud Console e copiar o campo `"client_secret"` diretamente de dentro do arquivo.

---

## 🎥 Regras de Publicação do YouTube Shorts
* **Formato:** Proporção vertical (**9:16**) ou quadrada (**1:1**).
* **Duração:** Até **60 segundos** (acima disso o YouTube publica como vídeo padrão).
* **Hashtag:** Incluir `#Shorts` no título ou descrição (já gerado automaticamente pela nossa IA).
