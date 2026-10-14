# 📱 Guia & Checklist Completo de Homologação do TikTok App

Este documento reúne todos os requisitos técnicos, legais e visuais necessários para homologar e aprovar o aplicativo oficial no portal **TikTok for Developers**, garantindo os escopos de publicação direta (`video.publish` e `video.upload`).

---

## 🎯 Objetivo
Habilitar a postagem e agendamento **100% automático** de vídeos no TikTok via API oficial, eliminando bloqueios de expiração de token e passando na auditoria da equipe de revisão global do TikTok.

---

## 📋 Checklist Geral de Homologação

### 1. Ajustes no Código do Sistema
- [ ] **Modal de Conexão OAuth na Interface (Frontend):**
  - Botão "Conectar TikTok" visível no painel (para gravação do fluxo de login no vídeo de auditoria).
  - Status em tempo real da conta (ex: `@perfil - Conectado` / `Desconectado`).
- [ ] **Endpoints de Autenticação OAuth 2.0 (Backend):**
  - Rota `GET /api/auth/tiktok/login`: Redireciona o usuário para `https://www.tiktok.com/v2/auth/authorize/` com `client_key`, `scope=video.publish,video.upload,user.info.basic`.
  - Rota `GET /api/auth/tiktok/callback`: Captura o `code` retornado pelo TikTok, troca por `access_token` e `refresh_token` na URL `https://open.tiktokapis.com/v2/oauth/token/` e salva com segurança.
- [ ] **Renovação Automática via Refresh Token (Backend):**
  - O `access_token` do TikTok expira a cada 24 horas.
  - Implementar verificação automática: antes de publicar, se o token expirou, renovar usando o `refresh_token` (válido por até 365 dias).
- [ ] **Envio Binário Direto (`FILE_UPLOAD`) no `tiktok.py`:**
  - Substituir o método `PULL_FROM_URL` por `FILE_UPLOAD`.
  - Fluxo: 
    1. Iniciar upload no TikTok (`/v2/post/publish/video/init/`) informando o tamanho do arquivo local.
    2. Receber a `upload_url`.
    3. Enviar o arquivo de vídeo via `PUT` binário direto do disco.
- [ ] **Páginas Legais Públicas (Frontend):**
  - Rota `/privacy`: Página da Política de Privacidade.
  - Rota `/terms`: Página dos Termos de Uso.
  - Links visíveis no rodapé da aplicação.

---

### 2. Configurações no Portal TikTok for Developers
- [ ] **Cadastro do App:**
  - Nome do App: idêntico ao exibido no painel (ex: `Social Stream Hub` ou novo nome escolhido).
  - Logo do App: Imagem quadrada limpa (512x512 ou 1024x1024 PNG).
  - Categoria: *Social Media Management* / *Content Creation Tools*.
- [ ] **URLs Obrigatórias no Painel:**
  - **Terms of Service URL:** Link público dos Termos de Uso.
  - **Privacy Policy URL:** Link público da Política de Privacidade.
  - **Redirect URI:** URL pública HTTPS de retorno (ex: `https://seu-dominio.com/api/auth/tiktok/callback`).
- [ ] **Configurar Sandbox Accounts (Essencial para os testes):**
  - No painel do app, acessar **Roles** > **Sandbox Accounts**.
  - Convidar o seu perfil do TikTok (`@seuperfil`).
  - Abrir o app do TikTok no smartphone e aceitar o convite na central de notificações.
- [ ] **Escopos Solicitados para Revisão:**
  - `video.publish`: Para publicação direta no feed.
  - `video.upload`: Para upload binário de vídeo.
  - `user.info.basic`: Para identificação da conta conectada.

---

## 🎬 3. Roteiro Obrigatório do Vídeo de Demonstração (Screencast)

O TikTok exige um vídeo demonstrativo (duração recomendada: 1 a 2 minutos) provando que o app utiliza as permissões de forma segura e legítima.

| Etapa | Duração | O que mostrar na tela |
| :--- | :--- | :--- |
| **1. Login OAuth** | 0s a 30s | Clique no botão **"Conectar TikTok"** dentro do painel. Mostre a tela oficial de login do TikTok abrindo no navegador, você logando e aceitando as permissões. Retorne ao painel mostrando o status "Conectado". |
| **2. Criação do Post** | 30s a 60s | Clique em **"Agendar Novo Vídeo"**, faça upload de um vídeo curto (9:16), preencha título e hashtags, marque o TikTok como destino e clique em **"Publicar Agora"**. |
| **3. Comprovação Real** | 60s a 90s | Abra o perfil do TikTok utilizado no teste (pelo navegador ou smartphone) e mostre o vídeo recém-publicado aparecendo no feed com a mesma legenda. |

> **Dica de Ouro:** A equipe de revisão do TikTok é global. Se possível, insira legendas em inglês simples ou grave sem fala, focando na clareza dos cliques e do fluxo técnico.

---

## 📜 4. Textos Oficiais para Homologação

### 📄 Política de Privacidade (`/privacy`)
```markdown
# Política de Privacidade — Social Stream Hub
Última atualização: Outubro de 2026

O Social Stream Hub preza pela segurança, privacidade e transparência no tratamento dos dados dos seus usuários. Esta Política de Privacidade descreve como coletamos, utilizamos e protegemos as informações através da integração oficial com a API do TikTok (Content Posting API).

1. Dados Coletados
Ao autorizar a integração do TikTok via fluxo oficial OAuth 2.0, nós acessamos exclusivamente:
- Identificador da Conta: ID público (open_id) e nome de exibição básico (escopo user.info.basic).
- Credenciais de Autorização: Tokens temporários de acesso (access_token) e renovação (refresh_token).
Não coletamos senhas, mensagens privadas, contatos telefônicos ou dados de pagamento.

2. Finalidade do Tratamento
Os dados são utilizados exclusivamente para:
- Identificar a conta conectada no painel;
- Realizar a publicação e o agendamento de vídeos explicitamente configurados pelo próprio usuário no sistema (escopos video.upload e video.publish).

3. Não Compartilhamento de Dados
O Social Stream Hub NÃO comercializa, NÃO compartilha e NÃO transfere dados de usuários do TikTok para parceiros comerciais, redes de anúncios ou quaisquer terceiros.

4. Segurança e Armazenamento
Os tokens de autenticação são armazenados com criptografia em banco de dados protegido. Os arquivos de vídeo são mantidos temporariamente em nossos servidores apenas pelo tempo estritamente necessário para concluir a transmissão para o TikTok.

5. Exclusão de Dados e Revogação de Permissões (Data Deletion Policy)
O usuário possui controle irrestrito sobre suas permissões:
- Revogação via TikTok: A qualquer momento em seu aplicativo TikTok em: Configurações e Privacidade > Segurança > Gerenciar permissões de apps > Social Stream Hub > Remover acesso.
- Revogação no Painel: Clicando em "Desconectar Conta" em nosso painel, o que exclui imediatamente todos os tokens armazenados.
- Solicitação de Exclusão Completa: Envie uma solicitação para suporte@socialstreamhub.com para exclusão definitiva de qualquer dado residual em até 48 horas úteis.

6. Contato do Encarregado de Dados
Para dúvidas ou solicitações sobre seus dados, entre em contato através de: suporte@socialstreamhub.com
```

---

### 📄 Termos de Uso (`/terms`)
```markdown
# Termos de Uso — Social Stream Hub
Última atualização: Outubro de 2026

Ao utilizar a plataforma Social Stream Hub, você concorda expressamente com os seguintes termos:

1. Objeto do Serviço
O Social Stream Hub é uma ferramenta de produtividade que viabiliza a distribuição e agendamento de conteúdos audiovisuais em múltiplas plataformas, incluindo YouTube, Instagram e TikTok.

2. Conformidade com Plataformas Parceiras
Ao conectar sua conta do TikTok, você se compromete a respeitar integralmente:
- Os Termos de Serviço do TikTok (https://www.tiktok.com/legal/terms-of-service);
- As Diretrizes da Comunidade do TikTok (https://www.tiktok.com/community-guidelines);
- As leis de direitos autorais e propriedade intelectual vigentes.

3. Responsabilidade pelo Conteúdo
O usuário é integral e exclusivamente responsável por todos os materiais (vídeos, títulos, descrições e hashtags) veiculados por meio da ferramenta. O Social Stream Hub não realiza moderação prévia nem assume responsabilidade pelo conteúdo publicado.

4. Disponibilidade e Limitações
A disponibilidade da postagem depende do funcionamento regular das APIs públicas de cada plataforma parceira. Não nos responsabilizamos por indisponibilidades temporárias decorrentes de manutenção ou limitações de cota das redes sociais.

5. Cancelamento
O usuário pode revogar o uso da ferramenta a qualquer instante. O descumprimento destes termos poderá resultar na suspensão do acesso à ferramenta.
```

---

## ⚡ 5. Soluções Alternativas Enquanto Aguarda a Aprovação (3 a 7 dias úteis)

Enquanto a revisão oficial do TikTok está em análise:
1. **Modo Sandbox:** Continue utilizando e postando normalmente na sua própria conta cadastrada na lista de Sandbox Accounts do app.
2. **Integração via Webhook / n8n:** Utilizar nós oficiais de automação (como n8n ou Make) que já possuem credenciais corporativas verificadas com o TikTok para publicação em tempo real.
