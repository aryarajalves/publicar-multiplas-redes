import React from 'react';
import { Film, X, Instagram, Users } from 'lucide-react';
import { InstagramProfile } from '../../types';

interface Props {
  onClose: () => void;
  isSubmitting: boolean;
  igProfile?: InstagramProfile | null;
}

export const UploadModalHeader: React.FC<Props> = ({ onClose, isSubmitting, igProfile }) => {
  return (
    <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200 shadow-2xs shrink-0">
          <Film className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">Publicar Conteúdo Multi-Redes</h2>
          <p className="text-xs text-slate-500 truncate">Poste simultaneamente no Instagram Reels, YouTube e TikTok</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {igProfile && igProfile.connected && (
          <div
            data-testid="modal-header-ig-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 border border-pink-200 text-xs shadow-2xs"
            title="Conta do Instagram conectada e seguidores atuais"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span className="font-bold text-pink-700" data-testid="modal-header-ig-username">
              {igProfile.account_name || `@${igProfile.username}`}
            </span>
            <span className="text-pink-300">•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700" data-testid="modal-header-ig-followers">
              <Users className="w-3 h-3 text-slate-500" />
              {Number(igProfile.followers_count || 0).toLocaleString('pt-BR')} seguidores
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          data-testid="btn-close-upload-modal"
          disabled={isSubmitting}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

