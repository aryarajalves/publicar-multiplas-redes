import React, { useEffect, useState } from 'react';
import { PlusCircle, RefreshCw, Radio, Play } from 'lucide-react';
import { api } from '../services/api';
import { InstagramProfile, YouTubeProfile, TikTokProfile } from '../types';
import { SocialProfilesDropdown } from './SocialProfilesDropdown';

interface Props {
  onOpenUpload: () => void;
  onRefresh: () => void;
  onOpenAccounts?: () => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<Props> = ({ onOpenUpload, onRefresh, onOpenAccounts, isLoading }) => {
  const [igProfile, setIgProfile] = useState<InstagramProfile | null>(null);
  const [ytProfile, setYtProfile] = useState<YouTubeProfile | null>(null);
  const [tkProfile, setTkProfile] = useState<TikTokProfile | null>(null);

  useEffect(() => {
    let active = true;

    const loadAllProfiles = async () => {
      try {
        if (typeof (api as any)?.getPlatformsProfiles === 'function') {
          const res = await api.getPlatformsProfiles();
          if (active && res) {
            if (res.instagram) setIgProfile(res.instagram);
            if (res.youtube) setYtProfile(res.youtube);
            if (res.tiktok) setTkProfile(res.tiktok);
            return;
          }
        }
      } catch {
        // Fallback em caso de erro na rota consolidada
      }

      // Fallbacks individuais para resiliência
      if (typeof (api as any)?.getInstagramProfile === 'function') {
        Promise.resolve(api.getInstagramProfile())
          .then((res) => {
            if (active && res && res.connected) setIgProfile(res);
          })
          .catch(() => {});
      }

      if (typeof (api as any)?.getYoutubeProfile === 'function') {
        Promise.resolve(api.getYoutubeProfile())
          .then((res) => {
            if (active && res) setYtProfile(res);
          })
          .catch(() => {});
      }

      if (typeof (api as any)?.getTiktokProfile === 'function') {
        Promise.resolve(api.getTiktokProfile())
          .then((res) => {
            if (active && res) setTkProfile(res);
          })
          .catch(() => {});
      }
    };

    loadAllProfiles();

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 min-w-0">
        {/* Bloco Esquerdo: Logotipo & Identificação da Plataforma */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20 shrink-0">
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          </div>
          <div className="shrink-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              MultiPost
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 whitespace-nowrap hidden sm:block">
              Agendamento & Cross-Posting
            </p>
          </div>
        </div>

        {/* Bloco Direito: Botão Unificado com Dropdown de Redes Sociais + Ações */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Botão Unificado que abre o popover de seguidores de cada rede social */}
          <SocialProfilesDropdown
            igProfile={igProfile}
            ytProfile={ytProfile}
            tkProfile={tkProfile}
            onOpenAccounts={onOpenAccounts}
          />

          <button
            onClick={onRefresh}
            title="Atualizar listagem"
            disabled={isLoading}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 shadow-xs disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenAccounts && (
            <button
              onClick={onOpenAccounts}
              data-testid="btn-open-accounts"
              title="Gerenciar Contas Conectadas"
              className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Radio className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>Contas</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            data-testid="btn-open-upload"
            className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[#ea384c] hover:bg-[#d82a3e] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Agendar Novo Vídeo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
