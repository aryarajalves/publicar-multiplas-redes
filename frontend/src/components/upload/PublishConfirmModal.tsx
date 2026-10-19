import React from 'react';
import { createPortal } from 'react-dom';
import { Send, X, Loader2, Youtube, Instagram, Video } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  videoTitle: string;
  platforms: string[];
}

export const PublishConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  videoTitle,
  platforms,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      data-testid="publish-confirm-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        data-testid="publish-confirm-modal-dialog"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          disabled={isLoading}
          data-testid="btn-close-publish-modal"
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Destaque */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-[#ea384c] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Send className="w-6 h-6 ml-0.5" />
        </div>

        {/* Título e Explicação */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Publicar Conteúdo Agora?
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto mb-3">
          Tem certeza de que deseja publicar este vídeo imediatamente nas redes selecionadas?
        </p>

        {/* Título do Vídeo em Destaque */}
        {videoTitle && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Título do Vídeo</p>
            <p className="text-xs font-semibold text-slate-800 truncate" title={videoTitle}>
              "{videoTitle}"
            </p>
          </div>
        )}

        {/* Badges das Redes Sociais de Destino */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {platforms.includes('youtube') && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
              <Youtube className="w-3.5 h-3.5 text-red-600" />
              <span>YouTube</span>
            </span>
          )}
          {platforms.includes('instagram') && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-semibold">
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>Instagram</span>
            </span>
          )}
          {platforms.includes('tiktok') && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-cyan-600" />
              <span>TikTok</span>
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            data-testid="btn-cancel-publish"
            className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            Voltar e Revisar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="btn-confirm-publish"
            className="w-1/2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Sim, Publicar Agora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
