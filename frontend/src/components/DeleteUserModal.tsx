import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { User } from '../types';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error?: string | null;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
  isDeleting,
  error,
}) => {
  if (!isOpen || !user) return null;

  const modalContent = (
    <div
      data-testid="delete-user-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        data-testid="delete-user-modal-dialog"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          onClick={onClose}
          disabled={isDeleting}
          data-testid="btn-close-delete-user"
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          Excluir Usuário?
        </h3>
        <p className="text-xs text-slate-600 mb-2">
          Você tem certeza que deseja remover o usuário <span className="font-semibold text-slate-900">"{user.name}"</span>?
        </p>
        <p className="text-[11px] text-slate-500 mb-6">
          E-mail: <span className="text-slate-700 font-mono font-medium">{user.email}</span>. Esta ação não poderá ser desfeita.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            data-testid="btn-cancel-delete-user"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="btn-confirm-delete-user"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

