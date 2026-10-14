import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, Loader2 } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      data-testid="logout-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        data-testid="logout-modal-dialog"
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Glow de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          disabled={isLoading}
          data-testid="btn-close-logout-modal"
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Saída com Glow */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/10">
          <LogOut className="w-6 h-6 ml-0.5" />
        </div>

        {/* Título e Texto */}
        <h3 className="text-lg font-bold text-white mb-2">
          Encerrar Sessão?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-2">
          Você tem certeza que deseja sair do painel <span className="font-semibold text-white">MultiPost</span>?
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
          Seus agendamentos ativos e publicações programadas continuarão rodando no servidor com total segurança.
        </p>

        {/* Ações */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            disabled={isLoading}
            data-testid="btn-cancel-logout"
            className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
          >
            Permanecer Conectado
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="btn-confirm-logout"
            className="w-1/2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Sim, Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

