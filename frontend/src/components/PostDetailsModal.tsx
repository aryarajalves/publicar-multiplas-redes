import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { StatusBadge } from './StatusBadge';
import { PlatformPublicationTab } from './PlatformPublicationTab';
import { PostMetricsSummary } from './PostMetricsSummary';
import { api } from '../services/api';
import {
  X,
  Calendar,
  ExternalLink,
  Send,
  Trash2,
  Instagram,
  Youtube,
  Video,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  post: Post | null;
  onClose: () => void;
  onPublishNow: (post: Post) => void;
  onDelete: (post: Post) => void;
  onMetricsUpdated?: () => void;
}

export const PostDetailsModal: React.FC<Props> = ({
  post: initialPost,
  onClose,
  onPublishNow,
  onDelete,
  onMetricsUpdated,
}) => {
  const [post, setPost] = useState<Post | null>(initialPost);
  const [activeTab, setActiveTab] = useState<string>('instagram');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const handleMetricsUpdated = async () => {
    if (post?.id) {
      try {
        const refreshed = await api.getPost(post.id);
        setPost(refreshed);
      } catch {
        // silent fallback
      }
    }
    if (onMetricsUpdated) {
      onMetricsUpdated();
    }
  };

  // Sincronizar aba ativa quando abrir um post
  useEffect(() => {
    if (post && post.publications && post.publications.length > 0) {
      setActiveTab(post.publications[0].platform);
    }
  }, [post?.id]);

  // Travar o scroll do mouse da página de fundo enquanto o modal estiver aberto
  useEffect(() => {
    if (post) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [post]);

  if (!post) return null;

  const videoUrl = api.getVideoUrl(post.video_path);
  const verticalThumbUrl = post.thumbnail_path ? api.getVideoUrl(post.thumbnail_path) : null;
  const youtubeThumbUrl = post.youtube_thumbnail_path ? api.getVideoUrl(post.youtube_thumbnail_path) : null;
  const posterUrl = youtubeThumbUrl || verticalThumbUrl || undefined;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
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

  const getPlatformIcon = (plat: string, className = "w-4 h-4") => {
    switch (plat.toLowerCase()) {
      case 'instagram':
        return <Instagram className={`${className} text-pink-600`} />;
      case 'youtube':
        return <Youtube className={`${className} text-red-600`} />;
      case 'tiktok':
        return <Video className={`${className} text-cyan-600`} />;
      default:
        return null;
    }
  };

  const getPlatformLabel = (plat: string) => {
    switch (plat.toLowerCase()) {
      case 'instagram':
        return 'Instagram Reels';
      case 'youtube': {
        const isShorts = (post.youtube_video_type || 'shorts').toLowerCase() === 'shorts';
        return `YouTube ${isShorts ? 'Shorts' : 'Vídeo Longo'}`;
      }
      case 'tiktok':
        return 'TikTok';
      default:
        return plat;
    }
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div
      data-testid="post-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 line-clamp-1">
              {post.youtube_title || post.title}
            </h2>
            <StatusBadge status={post.status} />
          </div>
          <button
            onClick={onClose}
            data-testid="btn-close-details"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Video Player */}
          <div className="rounded-xl overflow-hidden bg-slate-950 max-h-80 flex items-center justify-center border border-slate-200 shadow-inner">
            {videoUrl ? (
              <video
                src={videoUrl}
                poster={posterUrl}
                controls
                className="max-h-80 w-auto object-contain mx-auto"
              />
            ) : (
              <div className="p-8 text-slate-400 text-sm">Vídeo indisponível</div>
            )}
          </div>

          {/* Capas / Thumbnails do Vídeo */}
          {(verticalThumbUrl || youtubeThumbUrl) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3" data-testid="post-thumbnails-container">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Capas / Thumbnails Vinculadas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Capa Vertical (Reels / TikTok / Shorts) */}
                {verticalThumbUrl && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3.5 shadow-2xs" data-testid="detail-vertical-thumbnail">
                    <div className="w-16 h-28 rounded-md overflow-hidden bg-slate-950 border border-pink-500/40 shrink-0">
                      <img
                        src={verticalThumbUrl}
                        alt="Capa Vertical"
                        data-testid="detail-vertical-thumb-img"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-600" />
                        <span className="text-xs font-bold text-slate-800">Capa Vertical (9:16)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Instagram Reels • TikTok • Shorts
                      </p>
                      <a
                        href={verticalThumbUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        data-testid="link-view-vertical-thumb"
                        className="inline-flex items-center gap-1 text-[11px] text-pink-600 hover:text-pink-700 pt-1 font-semibold"
                      >
                        <span>Abrir imagem original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Capa Horizontal (YouTube Longo) */}
                {youtubeThumbUrl && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3.5 shadow-2xs" data-testid="detail-horizontal-thumbnail">
                    <div className="w-28 h-16 rounded-md overflow-hidden bg-slate-950 border border-red-500/40 shrink-0">
                      <img
                        src={youtubeThumbUrl}
                        alt="Capa Horizontal"
                        data-testid="detail-horizontal-thumb-img"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-xs font-bold text-slate-800">Capa Horizontal (16:9)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        YouTube Vídeos Longos
                      </p>
                      <a
                        href={youtubeThumbUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        data-testid="link-view-horizontal-thumb"
                        className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 pt-1 font-semibold"
                      >
                        <span>Abrir imagem original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Transcription (se disponível) */}
          {post.transcription && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Transcrição do Áudio</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {post.transcription}
              </p>
            </div>
          )}

          {/* Métricas de Performance e Engajamento */}
          <PostMetricsSummary post={post} onMetricsUpdated={handleMetricsUpdated} />

          {/* Schedule Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>
              Horário de Agendamento:{' '}
              <strong className="text-slate-800">{formatDate(post.scheduled_at)}</strong>
            </span>
          </div>

          {/* Seletor de Abas por Rede Social */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Conteúdo & Status por Rede Social
              </h4>
              <span className="text-[11px] text-slate-400">
                {post.publications.length} {post.publications.length === 1 ? 'rede selecionada' : 'redes selecionadas'}
              </span>
            </div>

            {/* Abas Horizontais */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
              {post.publications.map((pub) => {
                const isSelected = activeTab.toLowerCase() === pub.platform.toLowerCase();
                const isShorts = (post.youtube_video_type || 'shorts').toLowerCase() === 'shorts';
                return (
                  <button
                    key={pub.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-testid={`tab-${pub.platform}`}
                    onClick={() => setActiveTab(pub.platform)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span className={isSelected ? 'text-white [&>svg]:text-white' : ''}>
                      {getPlatformIcon(pub.platform, 'w-4 h-4')}
                    </span>
                    <span>
                      {pub.platform === 'youtube'
                        ? `YouTube ${isShorts ? 'Shorts' : 'Longo'}`
                        : pub.platform === 'instagram'
                        ? 'Instagram Reels'
                        : 'TikTok'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pub.status === 'published'
                          ? 'bg-emerald-500'
                          : pub.status === 'failed'
                          ? 'bg-rose-500'
                          : pub.status === 'in_progress'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                      title={`Status: ${pub.status}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Conteúdo da Rede Selecionada */}
            {(() => {
              const currentPub =
                post.publications.find((p) => p.platform.toLowerCase() === activeTab.toLowerCase()) ||
                post.publications[0];

              if (!currentPub) {
                return (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhuma rede social configurada para este post.
                  </div>
                );
              }

              return (
                <PlatformPublicationTab
                  publication={currentPub}
                  post={post}
                  formatDate={formatDate}
                  getPlatformIcon={getPlatformIcon}
                  getPlatformLabel={getPlatformLabel}
                  handleCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={() => {
              onDelete(post);
              onClose();
            }}
            data-testid="modal-btn-delete"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Publicação</span>
          </button>

          <div className="flex items-center gap-2">
            {(post.status === 'scheduled' || post.status === 'failed') && (
              <button
                onClick={() => onPublishNow(post)}
                data-testid="modal-btn-publish-now"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar Agora</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
