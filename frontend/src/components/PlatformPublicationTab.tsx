import React from 'react';
import { Post, PlatformPublication } from '../types';
import { StatusBadge } from './StatusBadge';
import { PostCommentsSection } from './PostCommentsSection';
import { ExternalLink, Copy, Check, AlertCircle, Heart, MessageCircle, Share2, Bookmark, Eye } from 'lucide-react';

interface Props {
  publication: PlatformPublication;
  post: Post;
  formatDate: (iso?: string | null) => string;
  getPlatformIcon: (plat: string, className?: string) => React.ReactNode;
  getPlatformLabel: (plat: string) => string;
  handleCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const PlatformPublicationTab: React.FC<Props> = ({
  publication,
  post,
  formatDate,
  getPlatformIcon,
  getPlatformLabel,
  handleCopy,
  copiedKey,
}) => {
  const isInstagram = publication.platform === 'instagram';
  const isYouTube = publication.platform === 'youtube';
  const isTikTok = publication.platform === 'tiktok';

  const textToCopy = isInstagram
    ? post.instagram_caption || post.caption || ''
    : isYouTube
    ? post.youtube_description || post.caption || ''
    : post.tiktok_caption || post.caption || '';

  return (
    <div
      key={publication.id}
      data-testid={`tabpanel-${publication.platform}`}
      className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in"
    >
      {/* Cabeçalho da Rede */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            {getPlatformIcon(publication.platform, 'w-5 h-5')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                {getPlatformLabel(publication.platform)}
              </p>
              {isYouTube && post.youtube_video_type && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 border border-red-200 text-red-700 font-semibold">
                  {post.youtube_video_type}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {publication.published_at
                ? `Publicado em ${formatDate(publication.published_at)}`
                : publication.status === 'in_progress'
                ? 'Enviando conteúdo agora...'
                : publication.status === 'skipped'
                ? 'Não enviado (Aguardando Instagram)'
                : publication.status === 'failed'
                ? 'Falha no envio da publicação'
                : 'Aguardando agendamento'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <StatusBadge status={publication.status} />

          {publication.post_url && (
            <a
              href={publication.post_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold transition-colors border border-slate-200 shadow-2xs"
            >
              <span>Abrir Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {textToCopy && (
            <button
              type="button"
              onClick={() => handleCopy(textToCopy, publication.platform)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold transition-colors border border-slate-200 shadow-2xs"
              title="Copiar texto enviado"
            >
              {copiedKey === publication.platform ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Métricas de Engajamento da Rede */}
      {publication.status === 'published' && (
        <div
          data-testid={`publication-metrics-${publication.platform}`}
          className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>📊 Desempenho nesta Rede</span>
            </span>
            {publication.last_metrics_sync_at && (
              <span className="text-[10px] text-slate-400">
                Sincronizado: {formatDate(publication.last_metrics_sync_at)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-50/60 border border-rose-100 rounded-lg">
              <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 leading-none">Curtidas</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {(publication.last_likes ?? 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/60 border border-blue-100 rounded-lg">
              <MessageCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 leading-none">Comentários</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {(publication.last_comments ?? 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
              <Share2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 leading-none">Compartilhamentos</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {(publication.last_shares ?? 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-50/60 border border-amber-100 rounded-lg">
              <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 leading-none">Salvamentos</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {(publication.last_saves ?? 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-purple-50/60 border border-purple-100 rounded-lg col-span-2 sm:col-span-1">
              <Eye className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 leading-none">Visualizações</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {(publication.last_views ?? 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Específico */}
      <div className="space-y-3">
        {/* YouTube: Título SEO, Descrição, Vídeo Recomendado e Tags */}
        {isYouTube && (
          <div className="space-y-3">
            {post.youtube_title && (
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  🎯 Título SEO do Vídeo
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {post.youtube_title}
                </p>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                📝 Descrição do YouTube
              </p>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {post.youtube_description || post.caption || (
                  <span className="italic text-slate-400">Sem descrição</span>
                )}
              </div>
            </div>

            {post.youtube_related_video && (
              <div
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-center justify-between gap-3"
                data-testid="detail-youtube-related-video"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-700">
                    🎬 Vídeo no Final / Recomendado:
                  </span>
                  <span className="font-mono text-[11px] font-bold">
                    {post.youtube_related_video}
                  </span>
                </div>
                <a
                  href={
                    post.youtube_related_video.startsWith('http')
                      ? post.youtube_related_video
                      : `https://www.youtube.com/watch?v=${post.youtube_related_video}`
                  }
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-semibold underline shrink-0"
                >
                  <span>Ver no YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {post.youtube_tags && (
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  🏷️ Tags
                </p>
                <p className="text-xs text-slate-600 font-mono">
                  {post.youtube_tags}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instagram: Legenda e Hashtags */}
        {isInstagram && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                📸 Legenda do Instagram
              </p>
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {post.instagram_caption || post.caption || (
                  <span className="italic text-slate-400">Sem legenda</span>
                )}
              </div>
            </div>

            {post.instagram_hashtags && (
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-[11px] font-bold text-pink-600 uppercase tracking-wider mb-1">
                  # Hashtags
                </p>
                <p className="text-xs text-pink-600 font-mono">
                  {post.instagram_hashtags}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TikTok: Legenda e Hashtags */}
        {isTikTok && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                🎵 Legenda do TikTok
              </p>
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {post.tiktok_caption || post.caption || (
                  <span className="italic text-slate-400">Sem legenda</span>
                )}
              </div>
            </div>

            {post.tiktok_hashtags && (
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider mb-1">
                  # Hashtags
                </p>
                <p className="text-xs text-slate-900 font-mono">
                  {post.tiktok_hashtags}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seção de Comentários e Respostas em Tempo Real (Instagram e YouTube) */}
        {(isInstagram || isYouTube) && publication.status === 'published' && (
          <PostCommentsSection
            postId={post.id}
            platform={publication.platform}
            externalPostId={publication.external_post_id}
          />
        )}

        {publication.error_message && (
          <div className="w-full mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="block font-semibold">Erro no envio:</strong>
              <span>{publication.error_message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
