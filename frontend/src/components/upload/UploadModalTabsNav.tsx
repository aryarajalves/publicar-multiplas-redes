import React from 'react';
import { Video, Share2, Calendar } from 'lucide-react';

interface Props {
  activeMainTab: 'media' | 'social' | 'schedule';
  setActiveMainTab: (tab: 'media' | 'social' | 'schedule') => void;
  hasFile: boolean;
  platformsCount: number;
}

export const UploadModalTabsNav: React.FC<Props> = ({
  activeMainTab,
  setActiveMainTab,
  hasFile,
  platformsCount,
}) => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 pt-2.5 shrink-0 flex items-center gap-2 overflow-x-auto">
      {/* Aba 1: Mídia */}
      <button
        type="button"
        onClick={() => setActiveMainTab('media')}
        data-testid="main-tab-media"
        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-t border-x transition-all shrink-0 ${
          activeMainTab === 'media'
            ? 'bg-white border-slate-200 text-[#ea384c] shadow-xs'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
        }`}
      >
        <Video className="w-4 h-4" />
        <span>1. Mídia (Vídeo e Capas)</span>
        {hasFile && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
      </button>

      {/* Aba 2: Redes */}
      <button
        type="button"
        onClick={() => setActiveMainTab('social')}
        data-testid="main-tab-social"
        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-t border-x transition-all shrink-0 ${
          activeMainTab === 'social'
            ? 'bg-white border-slate-200 text-[#ea384c] shadow-xs'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
        }`}
      >
        <Share2 className="w-4 h-4" />
        <span>2. Personalização das Redes</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
          {platformsCount}
        </span>
      </button>

      {/* Aba 3: Agendamento */}
      <button
        type="button"
        onClick={() => setActiveMainTab('schedule')}
        data-testid="main-tab-schedule"
        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-t border-x transition-all shrink-0 ${
          activeMainTab === 'schedule'
            ? 'bg-white border-slate-200 text-[#ea384c] shadow-xs'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>3. Agendamento & Publicar</span>
      </button>
    </div>
  );
};
