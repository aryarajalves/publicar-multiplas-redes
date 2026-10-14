import React from 'react';
import { ShieldCheck, ExternalLink, Lock, CheckCircle2, FileText, Mail } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = () => {
  return (
    <div
      data-testid="privacy-policy-page"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-pink-500/25 border border-slate-700/80 bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src="/logo.jpg"
                alt="MultiPost Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  MultiPost
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  Legal & LGPD
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Política de Privacidade Oficial</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/termosdeuso"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-800/60"
            >
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Termos de Uso</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Banner de Apresentação */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Conformidade com a API do TikTok, YouTube, Instagram e LGPD</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Política de Privacidade
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
              Esta política estabelece nosso compromisso inegociável com a proteção, privacidade e segurança dos seus dados pessoais e de acesso às redes sociais conectadas ao MultiPost.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <span>Última atualização: <strong>Outubro de 2026</strong></span>
              <span>•</span>
              <span>Versão do Documento: <strong>2.0</strong></span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Em vigor para todos os usuários</span>
              </span>
            </div>
          </div>
        </div>

        {/* Artigo da Política */}
        <article className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Seção 1 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">1</span>
              <span>Informações e Dados que Coletamos</span>
            </h2>
            <p>
              Ao conectar sua conta do TikTok, YouTube ou Instagram ao <strong>MultiPost</strong> através da autorização oficial (OAuth 2.0), nós coletamos <strong>estritamente</strong> os dados técnicos indispensáveis para realizar o agendamento e a publicação de seus conteúdos previamente autorizados por você:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong>Identificador Único da Conta:</strong> Seu identificador público (<code>open_id</code>) e nome de exibição básico retornado pelo escopo autorizado <code>user.info.basic</code>.
              </li>
              <li>
                <strong>Credenciais de Autorização (Tokens):</strong> Chaves criptografadas de autorização (<code>access_token</code> e <code>refresh_token</code>) concedidas para os escopos de publicação <code>video.upload</code> e <code>video.publish</code>.
              </li>
              <li>
                <strong>Arquivos de Mídia e Metadados:</strong> Títulos, descrições, hashtags e arquivos de vídeo enviados por você para agendamento.
              </li>
            </ul>
            <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-pink-400" />
              <span>O MultiPost <strong>NÃO</strong> tem acesso à sua senha do TikTok, mensagens privadas (DMs), histórico de navegação, lista de contatos ou dados de pagamento.</span>
            </div>
          </section>

          {/* Seção 2 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">2</span>
              <span>Finalidade e Como Utilizamos as Informações</span>
            </h2>
            <p>
              Todas as informações recebidas das APIs oficiais são utilizadas exclusivamente para os seguintes fins operacionais:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Autenticar sua conta vinculada e exibir o perfil conectado no painel de controle;</li>
              <li>Realizar o upload binário direto e acionar a publicação no TikTok no horário e com os parâmetros definidos por você;</li>
              <li>Renovar automaticamente as credenciais via <code>refresh_token</code> sem exigir novos logins frequentes;</li>
              <li>Registrar o histórico e status de envio (publicado, pendente ou falha) para sua conferência na interface.</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">3</span>
              <span>Não Comercialização e Não Compartilhamento</span>
            </h2>
            <p>
              O <strong>MultiPost não comercializa, não aluga, não transfere e não compartilha</strong> dados de usuários com terceiros, parceiros de publicidade ou corretores de dados. Suas informações são utilizadas estritamente para a finalidade de automação contratada por você.
            </p>
          </section>

          {/* Seção 4 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">4</span>
              <span>Armazenamento, Criptografia e Segurança</span>
            </h2>
            <p>
              Adotamos padrões rígidos de segurança da informação:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Tokens e dados de acesso são salvos em banco de dados isolado com criptografia em repouso e tráfego HTTPS/TLS;</li>
              <li>Arquivos de vídeo temporários enviados são processados e retidos apenas durante o ciclo de publicação agendado;</li>
              <li>Senhas de operadores do sistema utilizam criptografia de hash PBKDF2 com Salt criptográfico individual.</li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">5</span>
              <span>Revogação de Acesso e Exclusão de Dados (Data Deletion)</span>
            </h2>
            <p>
              Em conformidade com a LGPD e as diretrizes do TikTok for Developers, você possui total soberania sobre os seus dados e pode revogar o acesso a qualquer instante:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <p className="font-semibold text-xs text-pink-300 mb-1">Opção 1: No Painel</p>
                <p className="text-xs text-slate-400">
                  Acesse "Contas Sociais" e clique em <strong>"Desconectar"</strong> para apagar instantaneamente os tokens armazenados.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <p className="font-semibold text-xs text-indigo-300 mb-1">Opção 2: Pelo TikTok</p>
                <p className="text-xs text-slate-400">
                  No app do TikTok: <em>Configurações &gt; Segurança &gt; Gerenciar permissões de apps &gt; MultiPost &gt; Remover Acesso</em>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <p className="font-semibold text-xs text-emerald-300 mb-1">Opção 3: Por E-mail</p>
                <p className="text-xs text-slate-400">
                  Envie sua solicitação para <strong>suporte@multipost.com</strong>. Excluímos todos os registros em até 48 horas úteis.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 6 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">6</span>
              <span>Contato e Encarregado de Dados</span>
            </h2>
            <p>
              Dúvidas, requisições de titulares de dados ou esclarecimentos sobre esta Política de Privacidade podem ser encaminhados para:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 inline-flex items-center gap-2 text-xs text-slate-300">
              <Mail className="w-4 h-4 text-pink-400" />
              <span>E-mail do Encarregado (DPO / Suporte):</span>
              <a href="mailto:suporte@multipost.com" className="font-mono text-pink-300 hover:underline">
                suporte@multipost.com
              </a>
            </div>
          </section>
        </article>

        {/* Link para Termos de Uso inferior */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-end">
          <a
            href="/termosdeuso"
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Consultar Termos de Uso</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-400 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} MultiPost. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
