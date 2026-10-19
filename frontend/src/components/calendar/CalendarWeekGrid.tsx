import React from 'react';
import { Post } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { Clock, Instagram, Youtube, Video, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  currentDate: Date;
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectDay?: (date: Date) => void;
}

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export const CalendarWeekGrid: React.FC<Props> = ({
  currentDate,
  posts,
  onSelectPost,
  onSelectDay,
}) => {
  // Encontrar o domingo do início da semana corrente
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Mapear posts por data formatada 'YYYY-MM-DD'
  const postsByDate = posts.reduce<Record<string, Post[]>>((acc, post) => {
    if (!post.scheduled_at) return acc;
    try {
      const d = new Date(post.scheduled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(post);
    } catch {}
    return acc;
  }, {});

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[480px]">
        {days.map((dayDate, idx) => {
          const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(
            2,
            '0'
          )}-${String(dayDate.getDate()).padStart(2, '0')}`;
          const dayPosts = postsByDate[dateKey] || [];
          const isToday = isSameDay(dayDate, today);

          return (
            <div
              key={dateKey}
              data-testid={`calendar-week-col-${dateKey}`}
              className={`p-3 flex flex-col justify-between transition-colors ${
                isToday ? 'bg-red-50/20' : 'bg-white hover:bg-slate-50/40'
              }`}
            >
              {/* Header do Dia */}
              <div className="pb-3 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {WEEKDAYS[idx].split('-')[0]}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-base font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        isToday ? 'bg-[#ea384c] text-white shadow-xs' : 'text-slate-900'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {dayDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </span>
                  </div>
                </div>

                {onSelectDay && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(dayDate)}
                    title="Agendar neste dia"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Lista Vertical de Posts da Semana */}
              <div className="flex-1 py-3 space-y-2.5 overflow-y-auto max-h-[500px]">
                {dayPosts.length > 0 ? (
                  dayPosts.map((post) => {
                    const hasYoutube = post.publications?.some((p) => p.platform === 'youtube');
                    const hasInstagram = post.publications?.some((p) => p.platform === 'instagram');
                    const hasTiktok = post.publications?.some((p) => p.platform === 'tiktok');

                    return (
                      <div
                        key={post.id}
                        onClick={() => onSelectPost(post)}
                        data-testid={`week-post-card-${post.id}`}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-semibold text-slate-600 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTime(post.scheduled_at)}
                          </span>
                          <StatusBadge status={post.status} />
                        </div>

                        <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {post.youtube_title || post.title}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-400">
                          <span className="text-[10px]">Canais:</span>
                          <div className="flex items-center gap-1.5">
                            {hasYoutube && <Youtube className="w-3 h-3 text-red-600" />}
                            {hasInstagram && <Instagram className="w-3 h-3 text-pink-600" />}
                            {hasTiktok && <Video className="w-3 h-3 text-cyan-600" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-300">
                    <CalendarIcon className="w-6 h-6 stroke-1 mb-1" />
                    <span className="text-[11px]">Sem posts</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
