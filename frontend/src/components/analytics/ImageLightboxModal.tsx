import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, ZoomIn } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  // Trava scroll da página e ouve tecla ESC
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const content = (
    <div
      data-testid="image-lightbox-backdrop"
      className="fixed inset-0 z-[10005] w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Barra de Controles Superior */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between text-white pb-3 px-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0 pr-4">
          <ZoomIn className="w-4 h-4 text-amber-300 shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold truncate text-slate-200">
            {title || 'Visualização da Capa em Tamanho Real'}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="btn-open-original-image"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Abrir imagem original em nova aba"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova Aba</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-lightbox"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Fechar visualização (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Container Central com a Imagem Completa */}
      <div 
        className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={title || 'Capa do Vídeo'}
          data-testid="lightbox-full-image"
          className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-lg transition-transform"
        />
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">ESC</kbd> ou clique fora da imagem para fechar
      </p>
    </div>
  );

  return createPortal(content, document.body);
};
