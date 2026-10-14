import React, { useEffect } from 'react';
import { Post } from '../types';
import { StatusBadge } from './StatusBadge';
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
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  post: Post | null;
  onClose: () => void;
  onPublishNow: (post: Post) => void;
  onDelete: (post: Post) => void;
}

export const PostDetailsModal: React.FC<Props> = ({
  post,
  onClose,
  onPublishNow,
  onDelete,
}) => {
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

  const getPlatformIcon = (plat: string) => {
    switch (plat.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-400" />;
      case 'tiktok':
        return <Video className="w-4 h-4 text-cyan-400" />;
      default:
        return null;
    }
  };

  const getPlatformLabel = (plat: string) => {
    switch (plat.toLowerCase()) {
      case 'instagram':
        return 'Instagram Reels (Primário)';
      case 'youtube': {
        const isShorts = (post.youtube_video_type || 'shorts').toLowerCase() === 'shorts';
        return `YouTube ${isShorts ? 'Shorts' : 'Vídeo Longo'}`;
      }
      case 'tiktok':
        return 'TikTok (Cross-post)';
      default:
        return plat;
    }
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

          {/* Schedule Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>
              Horário de Agendamento:{' '}
              <strong className="text-slate-800">{formatDate(post.scheduled_at)}</strong>
            </span>
          </div>

          {/* Multi-platform Breakdown com cópias específicas */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Conteúdo & Status por Rede Social
            </h4>
            <div className="space-y-4">
              {post.publications.map((pub) => {
                const isInstagram = pub.platform === 'instagram';
                const isYouTube = pub.platform === 'youtube';
                const isTikTok = pub.platform === 'tiktok';

                return (
                  <div
                    key={pub.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3"
                  >
                    {/* Header da publicação */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                          {getPlatformIcon(pub.platform)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <span>{getPlatformLabel(pub.platform)}</span>
                            {isYouTube && post.youtube_video_type && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 border border-red-200 text-red-700 font-semibold">
                                {post.youtube_video_type}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {pub.published_at
                              ? `Publicado em ${formatDate(pub.published_at)}`
                              : pub.status === 'in_progress'
                              ? 'Enviando conteúdo...'
                              : pub.status === 'skipped'
                              ? 'Não enviado (Aguardando Instagram)'
                              : pub.status === 'failed'
                              ? 'Falha no envio'
                              : 'Aguardando agendamento'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <StatusBadge status={pub.status} />

                        {pub.post_url && (
                          <a
                            href={pub.post_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold transition-colors border border-slate-200 shadow-2xs"
                          >
                            <span>Abrir Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo específico da rede */}
                    <div className="mt-2 pt-3 border-t border-slate-200 text-xs space-y-2">
                      {isInstagram && (
                        <>
                          <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {post.instagram_caption || post.caption || <span className="italic text-slate-400">Sem legenda</span>}
                          </div>
                          {post.instagram_hashtags && (
                            <div className="text-pink-600 font-mono text-[11px]">
                              {post.instagram_hashtags}
                            </div>
                          )}
                        </>
                      )}

                      {isYouTube && (
                        <>
                          {post.youtube_title && (
                            <p className="font-semibold text-slate-900">
                              🎯 Título SEO: <span className="text-red-600">{post.youtube_title}</span>
                            </p>
                          )}
                          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {post.youtube_description || post.caption || <span className="italic text-slate-400">Sem descrição</span>}
                          </div>
                          {post.youtube_related_video && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-800 flex items-center gap-2" data-testid="detail-youtube-related-video">
                              <span className="font-semibold text-red-700">🎬 Vídeo no Final / Recomendado:</span>
                              <a
                                href={post.youtube_related_video.startsWith('http') ? post.youtube_related_video : `https://www.youtube.com/watch?v=${post.youtube_related_video}`}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-red-600 hover:text-red-700 underline font-mono text-[11px] truncate inline-flex items-center gap-1 font-semibold"
                              >
                                <span>{post.youtube_related_video}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </div>
                          )}
                          {post.youtube_tags && (
                            <div className="text-slate-600 font-mono text-[11px]">
                              🏷️ Tags: {post.youtube_tags}
                            </div>
                          )}
                        </>
                      )}

                      {isTikTok && (
                        <>
                          <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {post.tiktok_caption || post.caption || <span className="italic text-slate-400">Sem legenda</span>}
                          </div>
                          {post.tiktok_hashtags && (
                            <div className="text-slate-900 font-mono text-[11px]">
                              {post.tiktok_hashtags}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {pub.error_message && (
                      <div className="w-full mt-2 pt-2 border-t border-slate-200 flex items-start gap-2 text-xs text-rose-600">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{pub.error_message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
