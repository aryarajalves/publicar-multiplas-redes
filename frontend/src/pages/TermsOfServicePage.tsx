import React from 'react';
import { FileText, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = () => {
  return (
    <div
      data-testid="terms-of-service-page"
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-rose-100 selection:text-rose-900"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white flex items-center justify-center shrink-0">
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
                <span className="font-bold text-base text-slate-900">
                  MultiPost
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-[#ea384c] rounded border border-rose-200">
                  Termos
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Condições Gerais de Uso</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/politicaprivacidade"
              className="text-xs text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100"
            >
              <FileText className="w-3.5 h-3.5 text-[#ea384c]" />
              <span>Política de Privacidade</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Banner de Apresentação */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden mb-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#ea384c] text-xs font-semibold mb-4">
              <FileText className="w-4 h-4" />
              <span>Termos e Condições de Serviço</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Termos de Uso da Plataforma
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Estes Termos de Uso regem o acesso, as licenças e as responsabilidades na utilização das ferramentas de agendamento e publicação automatizada do MultiPost.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>Última atualização: <strong className="text-slate-700">Outubro de 2026</strong></span>
              <span>•</span>
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aplicável a todos os usuários e operadoras</span>
              </span>
            </div>
          </div>
        </div>

        {/* Artigo dos Termos */}
        <article className="space-y-6 text-slate-600 text-sm leading-relaxed">
          {/* Seção 1 */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 text-[#ea384c] text-xs font-bold border border-rose-100">1</span>
              <span>Objeto e Descrição dos Serviços</span>
            </h2>
            <p>
              O <strong className="text-slate-800">MultiPost</strong> é uma plataforma de gestão e automação de publicações em redes sociais que possibilita aos seus usuários conectar contas oficiais de terceiros (TikTok, YouTube e Instagram) para agendar, gerenciar e transmitir conteúdos de vídeo e postagens de maneira centralizada.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 text-[#ea384c] text-xs font-bold border border-rose-100">2</span>
              <span>Conformidade com Diretrizes e APIs de Terceiros</span>
            </h2>
            <p>
              Ao utilizar os recursos de publicação no TikTok através do MultiPost, o usuário declara e concorda expressamente em aderir a todas as regras das plataformas parceiras:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>
                <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" className="text-[#ea384c] hover:underline inline-flex items-center gap-1 font-medium">
                  <span>Termos de Serviço do TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>;
              </li>
              <li>
                <a href="https://www.tiktok.com/community-guidelines" target="_blank" rel="noreferrer" className="text-[#ea384c] hover:underline inline-flex items-center gap-1 font-medium">
                  <span>Diretrizes da Comunidade do TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>;
              </li>
              <li>Termos de Serviço da API do YouTube e Políticas da Plataforma Meta para Instagram.</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 text-[#ea384c] text-xs font-bold border border-rose-100">3</span>
              <span>Responsabilidade pelo Conteúdo Publicado</span>
            </h2>
            <p>
              O usuário é única e exclusivamente responsável por todos os arquivos de vídeo, legendas, áudios, imagens e hashtags transmitidos através da sua conta. O MultiPost não realiza moderação prévia editorial de conteúdos e não assume qualquer responsabilidade civil ou criminal sobre o material veiculado.
            </p>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>É estritamente proibido publicar conteúdos ilícitos, infratores de direitos autorais ou que violem a privacidade de terceiros.</span>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 text-[#ea384c] text-xs font-bold border border-rose-100">4</span>
              <span>Disponibilidade e Dependência de Redes Externas</span>
            </h2>
            <p>
              Os envios e publicações automatizadas dependem do funcionamento, latência e estabilidade das APIs fornecidas pelas plataformas proprietárias (TikTok, Google e Meta). O MultiPost envidará seus melhores esforços técnicos para garantir a máxima pontualidade nas publicações, mas não se responsabiliza por indisponibilidades temporárias causadas por instabilidades ou limitações de taxa (rate limits) impostas pelas próprias redes sociais.
            </p>
          </section>
        </article>

        {/* Link para Política de Privacidade inferior */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-end">
          <a
            href="/politicaprivacidade"
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors font-medium"
          >
            <span>Consultar Política de Privacidade</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#ea384c]" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; {new Date().getFullYear()} MultiPost. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
