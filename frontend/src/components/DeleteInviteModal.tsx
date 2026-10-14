import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Invitation } from '../types';

interface DeleteInviteModalProps {
  isOpen: boolean;
  invitation: Invitation | null;
  isDeleting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteInviteModal: React.FC<DeleteInviteModalProps> = ({
  isOpen,
  invitation,
  isDeleting,
  error,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !invitation) return null;

  return (
    <div
      data-testid="delete-invite-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        data-testid="delete-invite-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl text-center space-y-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Revogar Link de Convite?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tem certeza que deseja revogar o convite para a função{' '}
            <span className="font-semibold text-slate-900 capitalize">
              {invitation.role === 'admin' ? 'Administrador' : 'Editor'}
            </span>
            ? Uma vez excluído, o link deixará de funcionar imediatamente.
          </p>
        </div>

        {error && (
          <div
            data-testid="delete-invite-error"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            data-testid="btn-cancel-delete-invite"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="btn-confirm-delete-invite"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isDeleting ? 'Revogando...' : 'Revogar Convite'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
