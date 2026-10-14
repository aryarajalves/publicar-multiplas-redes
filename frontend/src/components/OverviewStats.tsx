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
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Vídeos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
          <p className="text-xs text-slate-400 mt-1">No fluxo de trabalho</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
          <Film className="w-6 h-6" />
        </div>
      </div>

      {/* Agendados */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agendados</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{scheduled}</p>
          <p className="text-xs text-slate-400 mt-1">Aguardando horário</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* Publicados com Sucesso */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Publicados no Feed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{published}</p>
          <p className="text-xs text-slate-400 mt-1">Concluídos com sucesso</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Cross-Posting Detalhado */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Redes Publicadas</p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-pink-600">
            <Instagram className="w-4 h-4" />
            <span className="font-semibold">{igStats?.total_published ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-600">
            <Youtube className="w-4 h-4" />
            <span className="font-semibold">{ytStats?.total_published ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <Video className="w-4 h-4" />
            <span className="font-semibold">{tkStats?.total_published ?? 0}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          Instagram primário + Cross-post automático
        </div>
      </div>
    </div>
  );
};
