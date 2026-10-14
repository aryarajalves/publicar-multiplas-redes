import React from 'react';
import { Post } from '../types';
import { StatusBadge } from './StatusBadge';
import { PlatformBadge } from './PlatformBadge';
import { api } from '../services/api';
import { Calendar, Play, Send, Eye, Trash2 } from 'lucide-react';

interface Props {
  post: Post;
  onViewDetails: (post: Post) => void;
  onPublishNow: (post: Post) => void;
  onDelete: (post: Post) => void;
}

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

  return (
    <div
      data-testid={`post-card-${post.id}`}
      className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col group shadow-lg"
    >
      {/* Video Preview / Header */}
      <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
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
          <div className="text-slate-600 flex flex-col items-center">
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
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium backdrop-blur-[2px]"
        >
          <Eye className="w-5 h-5" />
          <span>Ver Detalhes</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-100 line-clamp-1 text-base group-hover:text-pink-400 transition-colors">
            {post.title}
          </h3>
          {post.caption && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
              {post.caption}
            </p>
          )}

          {/* Date info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
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
        </div>

        {/* Actions Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPublishable && (
              <button
                onClick={() => onPublishNow(post)}
                data-testid={`btn-publish-now-${post.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar Agora</span>
              </button>
            )}

            <button
              onClick={() => onViewDetails(post)}
              data-testid={`btn-view-details-${post.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors border border-slate-700"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detalhes</span>
            </button>
          </div>

          <button
            onClick={() => onDelete(post)}
            data-testid={`btn-delete-${post.id}`}
            title="Excluir vídeo"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
