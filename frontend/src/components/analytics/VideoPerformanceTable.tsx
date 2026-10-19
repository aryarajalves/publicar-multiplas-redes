import React, { useState } from 'react';
import { 
  Flame, 
  Minus, 
  Snowflake, 
  Sparkles, 
  Eye, 
  Heart, 
  MessageSquare, 
  ArrowUpDown, 
  Video,
  ZoomIn
} from 'lucide-react';
import { VideoPerformanceItem, PlatformType } from '../../types';
import { api } from '../../services/api';
import { ImageLightboxModal } from './ImageLightboxModal';

interface Props {
  videos: VideoPerformanceItem[];
  onOpenDiagnosis: (video: VideoPerformanceItem) => void;
}

export const VideoPerformanceTable: React.FC<Props> = ({ videos = [], onOpenDiagnosis }) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformType>('all');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'high' | 'average' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'views' | 'recent' | 'engagement'>('views');
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Filtragem
  const filteredVideos = videos.filter((v) => {
    if (platformFilter !== 'all') {
      const hasPlatform = v.metrics.some((m) => m.platform === platformFilter);
      if (!hasPlatform) return false;
    }
    if (badgeFilter !== 'all' && v.performance_badge !== badgeFilter) {
      return false;
    }
    return true;
  });

  // Ordenação
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sortBy === 'views') return b.total_views - a.total_views;
    if (sortBy === 'engagement') return b.engagement_rate - a.engagement_rate;
    return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
  });

  const getBadgeStyle = (badge: 'high' | 'average' | 'low') => {
    switch (badge) {
      case 'high':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Alta Performance',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'average':
        return {
          icon: <Minus className="w-3.5 h-3.5 text-sky-600" />,
          label: 'Média Estável',
          className: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'low':
        return {
          icon: <Snowflake className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Abaixo da Média',
          className: 'bg-amber-50 text-amber-800 border-amber-200',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden" data-testid="video-performance-table">
      {/* Barra de Filtros e Ordenação */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Plataforma */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Rede:</span>
            {(['all', 'youtube', 'instagram', 'tiktok'] as const).map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setPlatformFilter(plat)}
                data-testid={`filter-plat-${plat}`}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer capitalize ${
                  platformFilter === plat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {plat === 'all' ? 'Todas' : plat}
              </button>
            ))}
          </div>

          {/* Filtro por Desempenho */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Status:</span>
            {(['all', 'high', 'average', 'low'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBadgeFilter(b)}
                data-testid={`filter-badge-${b}`}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                  badgeFilter === b
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {b === 'all' ? 'Todos' : b === 'high' ? '🔥 Alta' : b === 'average' ? '⚖️ Média' : '❄️ Baixa'}
              </button>
            ))}
          </div>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar por:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            data-testid="select-sort-by"
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#ea384c] cursor-pointer"
          >
            <option value="views">Mais Visualizados</option>
            <option value="engagement">Maior Engajamento</option>
            <option value="recent">Mais Recentes</option>
          </select>
        </div>
      </div>

      {/* Lista de Vídeos */}
      {sortedVideos.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {sortedVideos.map((item) => {
            const badge = getBadgeStyle(item.performance_badge);
            const thumbUrl = item.thumbnail_path
              ? api.getVideoUrl(item.thumbnail_path)
              : item.youtube_thumbnail_path
              ? api.getVideoUrl(item.youtube_thumbnail_path)
              : null;

            return (
              <div
                key={item.id}
                data-testid={`video-perf-item-${item.id}`}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Lado Esquerdo: Capa e Título */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    onClick={() => thumbUrl && setSelectedLightboxImage({ url: thumbUrl, title: item.title })}
                    data-testid={`btn-open-lightbox-${item.id}`}
                    title={thumbUrl ? "Clique para ver a capa em tamanho real" : undefined}
                    className={`w-24 sm:w-28 h-28 sm:h-32 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-200 relative group flex items-center justify-center p-1 ${
                      thumbUrl ? 'cursor-pointer hover:border-[#ea384c] transition-all shadow-xs' : ''
                    }`}
                  >
                    {thumbUrl ? (
                      <>
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 rounded-xl">
                          <ZoomIn className="w-4 h-4 text-amber-300" />
                          <span className="text-[10px] font-bold">Ver Capa</span>
                        </div>
                      </>
                    ) : (
                      <Video className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {new Date(item.scheduled_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Quebra por Plataforma */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {item.metrics.map((m) => (
                        <div
                          key={m.platform}
                          className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-1 rounded-md text-[11px] text-slate-700"
                        >
                          <span className="font-bold capitalize">{m.platform}:</span>
                          <span className="font-semibold text-slate-900">{m.views.toLocaleString('pt-BR')} views</span>
                          <span className="text-slate-400">•</span>
                          <span>{m.likes} likes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Totais Consolidados e Botão de Ação */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900 flex items-center justify-end gap-1.5">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span>{item.total_views.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>{item.total_likes}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-sky-500" />
                        <span>{item.total_comments}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDiagnosis(item)}
                    data-testid={`btn-open-diagnosis-${item.id}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Raio-X de IA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500">
          Nenhum vídeo publicado encontrado para os filtros selecionados.
        </div>
      )}

      {/* Visualizador de Capa em Tamanho Real */}
      <ImageLightboxModal
        isOpen={!!selectedLightboxImage}
        imageUrl={selectedLightboxImage?.url || null}
        title={selectedLightboxImage?.title}
        onClose={() => setSelectedLightboxImage(null)}
      />
    </div>
  );
};
