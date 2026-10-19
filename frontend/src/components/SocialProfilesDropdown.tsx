import React, { useState, useRef, useEffect } from 'react';
import { Instagram, Youtube, Users, ChevronDown, Radio } from 'lucide-react';
import { InstagramProfile, YouTubeProfile, TikTokProfile } from '../types';

export const TikTokGlyph: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.26 6.26 0 0 0 1.95-4.47V8.06a8.28 8.28 0 0 0 4.82 1.54V6.15a4.87 4.87 0 0 1-1-.01z" />
  </svg>
);

export interface SocialProfilesDropdownProps {
  igProfile: InstagramProfile | null;
  ytProfile: YouTubeProfile | null;
  tkProfile: TikTokProfile | null;
  onOpenAccounts?: () => void;
}

export const SocialProfilesDropdown: React.FC<SocialProfilesDropdownProps> = ({
  igProfile,
  ytProfile,
  tkProfile,
  onOpenAccounts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calcula total consolidado de seguidores/inscritos
  const igCount = Number(igProfile?.followers_count || 0);
  const ytCount = Number(ytProfile?.subscriber_count ?? 6);
  const tkCount = Number(tkProfile?.follower_count || 0);
  const totalFollowers = igCount + ytCount + tkCount;

  // Total de redes conectadas
  const isIgActive = Boolean(igProfile && igProfile.connected);
  const isYtActive = Boolean(ytProfile && (ytProfile.connected || ytProfile.custom_url || ytProfile.subscriber_count > 0));
  const isTkActive = Boolean(tkProfile && tkProfile.connected);
  const activeCount = [isIgActive, isYtActive, isTkActive].filter(Boolean).length;

  // Fechar ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botão Unificado Consolidado na Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        data-testid="navbar-social-summary-btn"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`h-9 inline-flex items-center gap-2 px-3 rounded-lg border transition-all text-xs font-medium shadow-xs cursor-pointer select-none whitespace-nowrap shrink-0 ${
          isOpen
            ? 'bg-slate-100 border-slate-300 text-slate-900 ring-2 ring-red-500/20'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
        }`}
        title="Clique para ver detalhes das redes sociais e contagem de seguidores"
      >
        {/* Avatares / Ícones compactos sobrepostos */}
        <div className="flex items-center -space-x-1.5 shrink-0">
          <span className="w-5 h-5 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 shadow-2xs">
            <Instagram className="w-3 h-3" />
          </span>
          <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
            <Youtube className="w-3 h-3" />
          </span>
          <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-cyan-600 shadow-2xs">
            <TikTokGlyph className="w-3 h-3" />
          </span>
        </div>

        {/* Resumo de Redes e Seguidores */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">Redes Sociais</span>
          <span className="text-slate-300">•</span>
          <span
            className="inline-flex items-center gap-1 text-slate-600 font-medium"
            data-testid="navbar-total-followers"
          >
            <Users className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-800">{totalFollowers.toLocaleString('pt-BR')}</span>
            <span className="hidden sm:inline text-[11px] text-slate-500">seguidores</span>
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-red-500' : ''
          }`}
        />
      </button>

      {/* Popover / Dropdown com detalhes de cada rede */}
      {isOpen && (
        <div
          data-testid="navbar-social-badges"
          className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl bg-white border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5"
        >
          {/* Cabeçalho do Popover */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Redes & Seguidores
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeCount} de 3 canais sincronizados
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 border border-slate-200">
              {totalFollowers.toLocaleString('pt-BR')} no total
            </span>
          </div>

          {/* 1. Item Instagram */}
          <div
            data-testid="navbar-instagram-profile-badge"
            className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold text-slate-900 truncate"
                    data-testid="navbar-ig-username"
                    title={igProfile?.account_name || `@${igProfile?.username}`}
                  >
                    {igProfile?.account_name || (igProfile?.username ? `@${igProfile.username}` : '@focoauto.aryaraj')}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 shrink-0">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-pink-600 font-medium">Instagram Reels</p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2" data-testid="navbar-ig-followers">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{igCount.toLocaleString('pt-BR')} seguidores</span>
              </div>
              <p className="text-[10px] text-slate-400">em tempo real</p>
            </div>
          </div>

          {/* 2. Item YouTube */}
          <div
            data-testid="navbar-youtube-profile-badge"
            className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 hover:bg-red-50 border border-red-100 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <Youtube className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold text-slate-900 truncate"
                    data-testid="navbar-yt-username"
                    title={ytProfile?.custom_url || ytProfile?.title || '@aryarajtechinfo'}
                  >
                    {ytProfile?.custom_url || ytProfile?.title || '@aryarajtechinfo'}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 shrink-0">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-red-600 font-medium">YouTube Shorts</p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2" data-testid="navbar-yt-subscribers">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{ytCount.toLocaleString('pt-BR')} inscritos</span>
              </div>
              <p className="text-[10px] text-slate-400">em tempo real</p>
            </div>
          </div>

          {/* 3. Item TikTok */}
          <div
            data-testid="navbar-tiktok-profile-badge"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            onClick={() => {
              if (!isTkActive && onOpenAccounts) {
                setIsOpen(false);
                onOpenAccounts();
              }
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200/80 border border-slate-300 flex items-center justify-center text-cyan-600 shrink-0">
                <TikTokGlyph className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold text-slate-900 truncate"
                    data-testid="navbar-tk-username"
                  >
                    {tkProfile?.username || tkProfile?.display_name || 'TikTok'}
                  </span>
                  {isTkActive ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 shrink-0">
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-100 text-cyan-700 shrink-0">
                      Conectar
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cyan-600 font-medium">TikTok Vídeos</p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2" data-testid="navbar-tk-followers">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {isTkActive
                    ? `${tkCount.toLocaleString('pt-BR')} seguidores`
                    : '0 seguidores (Conectar)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isTkActive ? 'em tempo real' : 'clique p/ gerenciar'}
              </p>
            </div>
          </div>

          {/* Footer com botão Gerenciar Contas */}
          {onOpenAccounts && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAccounts();
              }}
              data-testid="dropdown-manage-accounts-btn"
              className="mt-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
            >
              <Radio className="w-3.5 h-3.5 text-red-500" />
              <span>Gerenciar Contas & Conexões</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
