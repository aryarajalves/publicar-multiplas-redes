import React from 'react';
import { Eye, Heart, Flame, Sparkles, TrendingUp, Trophy, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';
import { AnalyticsOverview, WinningFormulaData } from '../../types';

interface Props {
  overview: AnalyticsOverview;
  winningFormula?: WinningFormulaData | null;
  onSelectBestVideo?: (videoId: number) => void;
}

export const PerformanceOverviewCards: React.FC<Props> = ({ overview, winningFormula, onSelectBestVideo }) => {
  const bestVideo = overview.videos.find((v) => v.id === overview.best_video_id);

  return (
    <div className="space-y-4" data-testid="performance-overview-section">
      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visualizações Totais */}
        <div
          data-testid="stat-card-views"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Visualizações Totais</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {overview.total_views.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Consolidado Multi-Redes</span>
            </div>
          </div>
        </div>

        {/* Card 2: Curtidas & Reações */}
        <div
          data-testid="stat-card-likes"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Curtidas & Reações</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#ea384c] flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-50" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {overview.total_likes.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <span>{overview.total_comments} comentários gerados</span>
            </div>
          </div>
        </div>

        {/* Card 3: Taxa Média de Engajamento */}
        <div
          data-testid="stat-card-engagement"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Taxa de Engajamento</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {overview.average_engagement_rate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <span>Média de interação por view</span>
            </div>
          </div>
        </div>

        {/* Card 4: Vídeo Campeão de Alcance */}
        <div
          data-testid="stat-card-best-video"
          className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Vídeo Campeão</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
              Top #1
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
              {bestVideo ? bestVideo.title : 'Nenhum vídeo publicado'}
            </p>
            {bestVideo && (
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-amber-100 text-[11px]">
                <span className="text-amber-900 font-semibold">
                  {bestVideo.total_views.toLocaleString('pt-BR')} views
                </span>
                {onSelectBestVideo && (
                  <button
                    onClick={() => onSelectBestVideo(bestVideo.id)}
                    className="text-[10px] font-bold text-[#ea384c] hover:underline flex items-center gap-0.5"
                  >
                    <span>Raio-X</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner de Destaque da IA: Recomendação Estratégica & Fórmula Vencedora */}
      <div
        data-testid="ai-strategic-insight-banner"
        className="bg-white border border-rose-100 rounded-xl p-4 shadow-2xs flex flex-col gap-3 bg-gradient-to-r from-rose-50/50 via-white to-slate-50"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ea384c] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Diagnóstico Inteligente de Conteúdo (IA)
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-[#ea384c] font-bold">
                Semanal
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {overview.top_insight}
            </p>
          </div>
        </div>

        {/* Card Expansível da Fórmula Vencedora quando disponível */}
        {winningFormula && winningFormula.key_rules && winningFormula.key_rules.length > 0 && (
          <div
            data-testid="winning-formula-summary-card"
            className="pt-3 border-t border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Fórmula Vencedora Comprovada:</span>
              </div>
              <p className="text-slate-700 font-medium">
                {winningFormula.top_performing_pattern}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {winningFormula.key_rules.slice(0, 2).map((rule, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-semibold"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{rule.split(':')[0]}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
