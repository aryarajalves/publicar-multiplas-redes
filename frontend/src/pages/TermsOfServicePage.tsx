import React from 'react';
import { FileText, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = () => {
  return (
    <div
      data-testid="terms-of-service-page"
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
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-pink-500/20 text-pink-300 rounded border border-pink-500/30">
                  Termos
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Condições Gerais de Uso</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/politicaprivacidade"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-800/60"
            >
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Política de Privacidade</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Banner de Apresentação */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold mb-4">
              <FileText className="w-4 h-4" />
              <span>Termos e Condições de Serviço</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Termos de Uso da Plataforma
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
              Estes Termos de Uso regem o acesso, as licenças e as responsabilidades na utilização das ferramentas de agendamento e publicação automatizada do MultiPost.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <span>Última atualização: <strong>Outubro de 2026</strong></span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aplicável a todos os usuários e operadoras</span>
              </span>
            </div>
          </div>
        </div>

        {/* Artigo dos Termos */}
        <article className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Seção 1 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">1</span>
              <span>Objeto e Descrição dos Serviços</span>
            </h2>
            <p>
              O <strong>MultiPost</strong> é uma plataforma de gestão e automação de publicações em redes sociais que possibilita aos seus usuários conectar contas oficiais de terceiros (TikTok, YouTube e Instagram) para agendar, gerenciar e transmitir conteúdos de vídeo e postagens de maneira centralizada.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">2</span>
              <span>Conformidade com Diretrizes e APIs de Terceiros</span>
            </h2>
            <p>
              Ao utilizar os recursos de publicação no TikTok através do MultiPost, o usuário declara e concorda expressamente em aderir a todas as regras das plataformas parceiras:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" className="text-pink-400 hover:underline inline-flex items-center gap-1">
                  <span>Termos de Serviço do TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>;
              </li>
              <li>
                <a href="https://www.tiktok.com/community-guidelines" target="_blank" rel="noreferrer" className="text-pink-400 hover:underline inline-flex items-center gap-1">
                  <span>Diretrizes da Comunidade do TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>;
              </li>
              <li>Termos de Serviço da API do YouTube e Políticas da Plataforma Meta para Instagram.</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">3</span>
              <span>Responsabilidade pelo Conteúdo Publicado</span>
            </h2>
            <p>
              O usuário é única e exclusivamente responsável por todos os arquivos de vídeo, legendas, áudios, imagens e hashtags transmitidos através da sua conta. O MultiPost não realiza moderação prévia editorial de conteúdos e não assume qualquer responsabilidade civil ou criminal sobre o material veiculado.
            </p>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>É estritamente proibido publicar conteúdos ilícitos, infratores de direitos autorais ou que violem a privacidade de terceiros.</span>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold">4</span>
              <span>Disponibilidade e Dependência de Redes Externas</span>
            </h2>
            <p>
              Os envios e publicações automatizadas dependem do funcionamento, latência e estabilidade das APIs fornecidas pelas plataformas proprietárias (TikTok, Google e Meta). O MultiPost envidará seus melhores esforços técnicos para garantir a máxima pontualidade nas publicações, mas não se responsabiliza por indisponibilidades temporárias causadas por instabilidades ou limitações de taxa (rate limits) impostas pelas próprias redes sociais.
            </p>
          </section>
        </article>

        {/* Link para Política de Privacidade inferior */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-end">
          <a
            href="/politicaprivacidade"
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Consultar Política de Privacidade</span>
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
