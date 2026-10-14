import React from 'react';
import { PlatformOverview } from '../types';
import { Film, Calendar, CheckCircle, Instagram, Youtube, Video } from 'lucide-react';

interface Props {
  overview: PlatformOverview | null;
}

export const OverviewStats: React.FC<Props> = ({ overview }) => {
  const total = overview?.total_posts ?? 0;
  const scheduled = overview?.total_scheduled ?? 0;
  const published = overview?.total_published ?? 0;
  
  const igStats = overview?.platforms.find(p => p.platform === 'instagram');
  const ytStats = overview?.platforms.find(p => p.platform === 'youtube');
  const tkStats = overview?.platforms.find(p => p.platform === 'tiktok');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total de Vídeos */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Total de Vídeos</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
          <p className="text-xs text-slate-500 mt-1">No fluxo de trabalho</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Film className="w-6 h-6" />
        </div>
      </div>

      {/* Agendados */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Agendados</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{scheduled}</p>
          <p className="text-xs text-slate-500 mt-1">Aguardando horário</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* Publicados com Sucesso */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Publicados no Feed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{published}</p>
          <p className="text-xs text-slate-500 mt-1">Concluídos com sucesso</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Cross-Posting Detalhado */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 mb-2">Redes Publicadas</p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-pink-400">
            <Instagram className="w-4 h-4" />
            <span className="font-semibold">{igStats?.total_published ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <Youtube className="w-4 h-4" />
            <span className="font-semibold">{ytStats?.total_published ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Video className="w-4 h-4" />
            <span className="font-semibold">{tkStats?.total_published ?? 0}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          Instagram primário + Cross-post automático
        </div>
      </div>
    </div>
  );
};
