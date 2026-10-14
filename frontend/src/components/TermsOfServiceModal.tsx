import React, { useEffect } from 'react';
import { X, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="terms-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Termos de Uso</h2>
              <p className="text-xs text-slate-400">MultiPost — Condições gerais de utilização da plataforma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="btn-close-terms-modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p className="text-slate-400 text-xs">Última atualização: Outubro de 2026</p>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">1. Objeto do Serviço</h3>
            <p>
              O <strong>MultiPost</strong> é uma ferramenta de produtividade que oferece recursos de agendamento e publicação automatizada de vídeos em múltiplas plataformas parceiras (incluindo YouTube, Instagram e TikTok).
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">2. Conformidade com Plataformas Parceiras</h3>
            <p>
              Ao conectar sua conta do TikTok, você concorda expressamente em cumprir:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Os Termos de Serviço do TikTok (<a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" className="text-cyan-400 underline">tiktok.com/legal/terms-of-service</a>);</li>
              <li>As Diretrizes da Comunidade do TikTok (<a href="https://www.tiktok.com/community-guidelines" target="_blank" rel="noreferrer" className="text-cyan-400 underline">tiktok.com/community-guidelines</a>);</li>
              <li>Todas as leis relativas a propriedade intelectual e direitos autorais.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">3. Responsabilidade pelo Conteúdo</h3>
            <p>
              O usuário é único e integralmente responsável por todo o conteúdo (vídeos, legendas, áudios e hashtags) transmitido através da ferramenta. O MultiPost não realiza moderação editorial prévia e não responde pelo teor das publicações dos usuários.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">4. Disponibilidade das APIs</h3>
            <p>
              O funcionamento dos disparos automáticos depende da estabilidade dos serviços fornecidos pelas plataformas externas. O MultiPost não assume responsabilidade por interrupções temporárias de servidores, limites de requisição ou instabilidades nas APIs do TikTok ou Google.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
