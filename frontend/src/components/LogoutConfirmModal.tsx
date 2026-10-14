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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        data-testid="logout-modal-dialog"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          disabled={isLoading}
          data-testid="btn-close-logout-modal"
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Saída */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <LogOut className="w-6 h-6 ml-0.5" />
        </div>

        {/* Título e Texto */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Encerrar Sessão?
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto mb-2">
          Você tem certeza que deseja sair do painel <span className="font-semibold text-slate-900">MultiPost</span>?
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto mb-6">
          Seus agendamentos ativos e publicações programadas continuarão rodando no servidor com total segurança.
        </p>

        {/* Ações */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            data-testid="btn-cancel-logout"
            className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            Permanecer Conectado
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="btn-confirm-logout"
            className="w-1/2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
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

