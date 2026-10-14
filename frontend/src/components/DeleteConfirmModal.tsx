import React from 'react';
import { Trash2, AlertTriangle, X, Loader2, Film } from 'lucide-react';
import { Post } from '../types';
import { api } from '../services/api';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  errorMessage?: string | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  post,
  onClose,
  onConfirm,
  isDeleting = false,
  errorMessage = null,
}) => {
  if (!isOpen || !post) return null;

  const thumbnailSrc = post.thumbnail_path
    ? api.getVideoUrl(post.thumbnail_path)
    : undefined;

  return (
    <div
      data-testid="delete-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      // Explicitamente NÃO fecha ao clicar no fundo exterior
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 flex flex-col space-y-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header com Ícone de Alerta */}
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-950/40">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            data-testid="btn-close-delete-modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Textos Informativos */}
        <div className="space-y-1">
          <h3
            data-testid="delete-modal-title"
            className="text-base sm:text-lg font-bold text-white tracking-tight"
          >
            Excluir Publicação
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tem certeza de que deseja excluir esta publicação? Esta ação é definitiva e removerá o vídeo e todos os dados associados.
          </p>
        </div>

        {/* Card de Preview do Post Alvo */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-black border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Film className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              data-testid="delete-modal-post-title"
              className="text-xs sm:text-sm font-semibold text-slate-200 truncate"
            >
              {post.title}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ID #{post.id} • {post.status.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Banner de Erro caso a exclusão falhe */}
        {errorMessage && (
          <div
            data-testid="delete-modal-error"
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            data-testid="btn-cancel-delete"
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="btn-confirm-delete"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/50 transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Publicação</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
