import React from 'react';
import { Post } from '../types';
import { StatusBadge } from './StatusBadge';
import { PlatformBadge } from './PlatformBadge';
import { api } from '../services/api';
import { Calendar, Play, Send, Eye, Trash2, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface Props {
  post: Post;
  onViewDetails: (post: Post) => void;
  onPublishNow: (post: Post) => void;
  onDelete: (post: Post) => void;
}

const formatCompact = (num: number) => {
  if (!num || num <= 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

export const PostCard: React.FC<Props> = ({
  post,
  onViewDetails,
  onPublishNow,
  onDelete,
}) => {
  const videoUrl = api.getVideoUrl(post.video_path);
  const verticalThumbUrl = post.thumbnail_path ? api.getVideoUrl(post.thumbnail_path) : null;
  const youtubeThumbUrl = post.youtube_thumbnail_path ? api.getVideoUrl(post.youtube_thumbnail_path) : null;
  const posterUrl = youtubeThumbUrl || verticalThumbUrl || null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isPublishable = post.status === 'scheduled' || post.status === 'failed';

  const totalLikes = post.total_likes ?? post.publications.reduce((acc, p) => acc + (p.last_likes || 0), 0);
  const totalComments = post.total_comments ?? post.publications.reduce((acc, p) => acc + (p.last_comments || 0), 0);
  const totalShares = post.total_shares ?? post.publications.reduce((acc, p) => acc + (p.last_shares || 0), 0);
  const totalSaves = post.total_saves ?? post.publications.reduce((acc, p) => acc + (p.last_saves || 0), 0);
  const totalViews = post.total_views ?? post.publications.reduce((acc, p) => acc + (p.last_views || 0), 0);
  const isPublished = post.status === 'published' || post.publications.some((p) => p.status === 'published');

  return (
    <div
      data-testid={`post-card-${post.id}`}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all flex flex-col group shadow-sm hover:shadow-md"
    >
      {/* Video Preview / Header */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={post.title}
            data-testid={`post-card-thumb-${post.id}`}
            className="w-full h-full object-cover"
          />
        ) : videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
        ) : (
          <div className="text-slate-400 flex flex-col items-center">
            <Play className="w-10 h-10 opacity-40" />
            <span className="text-xs mt-1">Pré-visualização</span>
          </div>
        )}

        {/* Status Badge overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={post.status} />
        </div>

        {/* Hover overlay button to view */}
        <button
          onClick={() => onViewDetails(post)}
          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium backdrop-blur-[2px]"
        >
          <Eye className="w-5 h-5" />
          <span>Ver Detalhes</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1 text-base group-hover:text-[#ea384c] transition-colors">
            {post.title}
          </h3>
          {post.caption && (
            <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
              {post.caption}
            </p>
          )}

          {/* Date info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Agendado para: {formatDate(post.scheduled_at)}</span>
          </div>

          {/* Platform badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {post.publications.map((pub) => (
              <PlatformBadge
                key={pub.id}
                platform={pub.platform}
                status={pub.status}
                showStatusIcon={true}
                videoType={pub.platform === 'youtube' ? post.youtube_video_type : undefined}
              />
            ))}
          </div>

          {/* Barra de Métricas de Desempenho (Curtidas, Comentários, Compartilhamentos, Salvamentos, Visualizações) */}
          {isPublished && (
            <div
              data-testid={`post-metrics-bar-${post.id}`}
              className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600"
            >
              <div className="flex items-center gap-3">
                <span
                  title="Curtidas"
                  data-testid={`post-metric-likes-${post.id}`}
                  className="flex items-center gap-1 text-rose-600"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{formatCompact(totalLikes)}</span>
                </span>
                <span
                  title="Comentários"
                  data-testid={`post-metric-comments-${post.id}`}
                  className="flex items-center gap-1 text-indigo-600"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{formatCompact(totalComments)}</span>
                </span>
                <span
                  title="Compartilhamentos"
                  data-testid={`post-metric-shares-${post.id}`}
                  className="flex items-center gap-1 text-sky-600"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>{formatCompact(totalShares)}</span>
                </span>
                <span
                  title="Salvamentos"
                  data-testid={`post-metric-saves-${post.id}`}
                  className="flex items-center gap-1 text-amber-600"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{formatCompact(totalSaves)}</span>
                </span>
              </div>
              <span
                title="Visualizações / Alcance"
                data-testid={`post-metric-views-${post.id}`}
                className="flex items-center gap-1 text-slate-500 font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatCompact(totalViews)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPublishable && (
              <button
                onClick={() => onPublishNow(post)}
                data-testid={`btn-publish-now-${post.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar Agora</span>
              </button>
            )}

            <button
              onClick={() => onViewDetails(post)}
              data-testid={`btn-view-details-${post.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detalhes</span>
            </button>
          </div>

          <button
            onClick={() => onDelete(post)}
            data-testid={`btn-delete-${post.id}`}
            title="Excluir vídeo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
