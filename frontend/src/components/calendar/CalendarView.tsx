import React, { useState, useMemo } from 'react';
import { Post } from '../../types';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarWeekGrid } from './CalendarWeekGrid';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Props {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onOpenUpload: () => void;
}

type ViewMode = 'month' | 'week';

export const CalendarView: React.FC<Props> = ({ posts, onSelectPost, onOpenUpload }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Navegar entre meses/semanas
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(prev.getMonth() - 1);
      } else {
        next.setDate(prev.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(prev.getMonth() + 1);
      } else {
        next.setDate(prev.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtrar posts por plataforma e status
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedPlatform !== 'all') {
        const matchesPlat = post.publications?.some(
          (p) => p.platform.toLowerCase() === selectedPlatform.toLowerCase()
        );
        if (!matchesPlat) return false;
      }

      if (selectedStatus !== 'all') {
        if (selectedStatus === 'scheduled' && post.status !== 'scheduled') return false;
        if (selectedStatus === 'published' && post.status !== 'published') return false;
        if (selectedStatus === 'failed' && post.status !== 'failed') return false;
      }

      return true;
    });
  }, [posts, selectedPlatform, selectedStatus]);

  // Estatísticas do mês atual exibido
  const monthStats = useMemo(() => {
    const curMonth = currentDate.getMonth();
    const curYear = currentDate.getFullYear();

    const monthPosts = filteredPosts.filter((post) => {
      if (!post.scheduled_at) return false;
      try {
        const d = new Date(post.scheduled_at);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      } catch {
        return false;
      }
    });

    const scheduledCount = monthPosts.filter((p) => p.status === 'scheduled').length;
    const publishedCount = monthPosts.filter((p) => p.status === 'published').length;

    // Dias distintos com publicação
    const distinctDays = new Set(
      monthPosts.map((p) => new Date(p.scheduled_at).getDate())
    ).size;

    return {
      total: monthPosts.length,
      scheduled: scheduledCount,
      published: publishedCount,
      activeDays: distinctDays,
    };
  }, [filteredPosts, currentDate]);

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const year = currentDate.getFullYear();

  return (
    <div className="space-y-6 animate-fade-in" data-testid="calendar-view">
      {/* Header com Controles Principais */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        {/* Navegação de Mês */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[#ea384c] shadow-2xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900" data-testid="calendar-header-title">
                {capitalizedMonth} {year}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Planejamento editorial e visão panorâmica de publicações
            </p>
          </div>

          {/* Botões de seta e Hoje */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <button
              type="button"
              onClick={handlePrev}
              data-testid="calendar-btn-prev"
              title="Mês/Semana anterior"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              data-testid="calendar-btn-today"
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNext}
              data-testid="calendar-btn-next"
              title="Próximo mês/semana"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controles da Direita: Mês/Semana e Ação de Agendamento */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Mês / Semana */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              data-testid="view-toggle-month"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              data-testid="view-toggle-week"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Botão Novo Agendamento */}
          <button
            type="button"
            onClick={onOpenUpload}
            data-testid="calendar-btn-new-post"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Agendados para este mês
            </p>
            <p className="text-xl font-extrabold text-sky-700 mt-1">
              {monthStats.scheduled} vídeos
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Publicados com Sucesso
            </p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">
              {monthStats.published} vídeos
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dias com Publicações
            </p>
            <p className="text-xl font-extrabold text-purple-700 mt-1">
              {monthStats.activeDays} dias ativos
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Rede Social e Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Rede:
          </span>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'youtube', label: 'YouTube' },
            { id: 'instagram', label: 'Instagram' },
            { id: 'tiktok', label: 'TikTok' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`calendar-filter-platform-${item.id}`}
              onClick={() => setSelectedPlatform(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPlatform === item.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'scheduled', label: 'Agendados' },
            { id: 'published', label: 'Publicados' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`calendar-filter-status-${item.id}`}
              onClick={() => setSelectedStatus(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === item.id
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Renderização da Grade: Mês ou Semana */}
      {viewMode === 'month' ? (
        <CalendarMonthGrid
          currentDate={currentDate}
          posts={filteredPosts}
          onSelectPost={onSelectPost}
          onSelectDay={() => onOpenUpload()}
        />
      ) : (
        <CalendarWeekGrid
          currentDate={currentDate}
          posts={filteredPosts}
          onSelectPost={onSelectPost}
          onSelectDay={() => onOpenUpload()}
        />
      )}
    </div>
  );
};
