import React, { useState } from 'react';
import { Post } from '../types';
import { api } from '../services/api';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface Props {
  post: Post;
  onMetricsUpdated?: () => void;
}

const formatNumber = (num?: number | null) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('pt-BR');
};

export const PostMetricsSummary: React.FC<Props> = ({ post, onMetricsUpdated }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const totalLikes = post.total_likes ?? post.publications.reduce((acc, p) => acc + (p.last_likes || 0), 0);
  const totalComments = post.total_comments ?? post.publications.reduce((acc, p) => acc + (p.last_comments || 0), 0);
  const totalShares = post.total_shares ?? post.publications.reduce((acc, p) => acc + (p.last_shares || 0), 0);
  const totalSaves = post.total_saves ?? post.publications.reduce((acc, p) => acc + (p.last_saves || 0), 0);
  const totalViews = post.total_views ?? post.publications.reduce((acc, p) => acc + (p.last_views || 0), 0);

  const isPublished = post.status === 'published' || post.publications.some((p) => p.status === 'published');

  const handleSyncMetrics = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await api.syncPostMetrics(post.id);
      setSyncFeedback('Métricas atualizadas com sucesso!');
      if (onMetricsUpdated) onMetricsUpdated();
    } catch {
      setSyncFeedback('Não foi possível sincronizar agora.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  if (!isPublished) return null;

  return (
    <div
      data-testid="post-metrics-summary-card"
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Desempenho & Engajamento em Tempo Real
            </h4>
            <p className="text-[11px] text-slate-500">
              Total consolidado de interações capturadas nas redes sociais oficiais.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncMetrics}
          disabled={isSyncing}
          data-testid="btn-sync-post-metrics"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-pink-600' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Métricas'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200 animate-fade-in">
          {syncFeedback}
        </div>
      )}

      {/* Cards de Métricas em Grade */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Curtidas */}
        <div
          data-testid="metric-card-likes"
          className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Curtidas</span>
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          </div>
          <span className="text-base font-extrabold text-slate-900" data-testid="metric-val-likes">
            {formatNumber(totalLikes)}
          </span>
        </div>

        {/* Comentários */}
        <div
          data-testid="metric-card-comments"
          className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/80 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Comentários</span>
            <MessageCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-base font-extrabold text-slate-900" data-testid="metric-val-comments">
            {formatNumber(totalComments)}
          </span>
        </div>

        {/* Compartilhamentos */}
        <div
          data-testid="metric-card-shares"
          className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200/80 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-sky-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Compartilhamentos</span>
            <Share2 className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-base font-extrabold text-slate-900" data-testid="metric-val-shares">
            {formatNumber(totalShares)}
          </span>
        </div>

        {/* Salvamentos */}
        <div
          data-testid="metric-card-saves"
          className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Salvamentos</span>
            <Bookmark className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <span className="text-base font-extrabold text-slate-900" data-testid="metric-val-saves">
            {formatNumber(totalSaves)}
          </span>
        </div>

        {/* Visualizações / Alcance */}
        <div
          data-testid="metric-card-views"
          className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Visualizações</span>
            <Eye className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-base font-extrabold text-slate-900" data-testid="metric-val-views">
            {formatNumber(totalViews)}
          </span>
        </div>
      </div>
    </div>
  );
};
