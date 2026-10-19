import React from 'react';
import { Post } from '../../types';
import { Instagram, Youtube, Video, Clock } from 'lucide-react';

interface Props {
  post: Post;
  onClick: (post: Post) => void;
}

export const CalendarPostPill: React.FC<Props> = ({ post, onClick }) => {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200';
      case 'scheduled':
        return 'bg-sky-50/90 hover:bg-sky-100/90 text-sky-800 border-sky-200';
      case 'publishing':
        return 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border-amber-200 animate-pulse';
      case 'failed':
        return 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const timeStr = formatTime(post.scheduled_at);
  const displayTitle = post.youtube_title || post.title || 'Sem título';

  // Verificar plataformas do post
  const hasInstagram = post.publications?.some((p) => p.platform === 'instagram');
  const hasYoutube = post.publications?.some((p) => p.platform === 'youtube');
  const hasTiktok = post.publications?.some((p) => p.platform === 'tiktok');

  return (
    <button
      type="button"
      onClick={() => onClick(post)}
      data-testid={`calendar-post-pill-${post.id}`}
      title={`${displayTitle} • ${timeStr || 'Horário não definido'}`}
      className={`w-full text-left p-1.5 rounded-lg border text-[11px] font-medium transition-all shadow-2xs group flex flex-col gap-1 cursor-pointer select-none ${getStatusStyles(
        post.status
      )}`}
    >
      <div className="flex items-center justify-between gap-1 w-full">
        <div className="flex items-center gap-1 shrink-0 font-semibold text-[10px]">
          <Clock className="w-2.5 h-2.5 opacity-70" />
          <span>{timeStr || '—'}</span>
        </div>

        {/* Mini badges das redes */}
        <div className="flex items-center gap-0.5 shrink-0">
          {hasYoutube && <Youtube className="w-2.5 h-2.5 text-red-600" />}
          {hasInstagram && <Instagram className="w-2.5 h-2.5 text-pink-600" />}
          {hasTiktok && <Video className="w-2.5 h-2.5 text-cyan-600" />}
        </div>
      </div>

      <p className="truncate w-full font-semibold group-hover:underline text-[11px] leading-tight">
        {displayTitle}
      </p>
    </button>
  );
};
