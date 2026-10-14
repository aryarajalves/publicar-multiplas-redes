import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Post } from '../types';
import { MediaUploadTab } from './upload/MediaUploadTab';
import { SocialNetworksTab } from './upload/SocialNetworksTab';
import { ScheduleTab } from './upload/ScheduleTab';
import { ExpandedFieldModal } from './upload/ExpandedFieldModal';
import {
  X,
  Film,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Video,
  Share2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (post: Post) => void;
}

type MainTabType = 'media' | 'social' | 'schedule';

export const VideoUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Travar o scroll da página de fundo quando o popup estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Aba principal ativa (3 Abas Agrupadas)
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('media');

  // Mídia
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');

  // Redes sociais
  const [instagramCaption, setInstagramCaption] = useState('');
  const [instagramHashtags, setInstagramHashtags] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeDescription, setYoutubeDescription] = useState('');
  const [youtubeTags, setYoutubeTags] = useState('');
  const [youtubeVideoType, setYoutubeVideoType] = useState('Shorts');
  const [youtubeRelatedVideo, setYoutubeRelatedVideo] = useState('');
  const [tiktokCaption, setTiktokCaption] = useState('');
  const [tiktokHashtags, setTiktokHashtags] = useState('');

  // Thumbnails upload
  const [verticalThumbnail, setVerticalThumbnail] = useState<File | null>(null);
  const [verticalThumbnailPreview, setVerticalThumbnailPreview] = useState<string | null>(null);
  const verticalThumbInputRef = useRef<HTMLInputElement>(null);
  const [horizontalThumbnail, setHorizontalThumbnail] = useState<File | null>(null);
  const [horizontalThumbnailPreview, setHorizontalThumbnailPreview] = useState<string | null>(null);
  const horizontalThumbInputRef = useRef<HTMLInputElement>(null);

  // Sub-aba ativa das redes sociais
  const [activePlatformTab, setActivePlatformTab] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');

  // Campo de texto maximizado para edição expandida
  const [expandedField, setExpandedField] = useState<{
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null>(null);

  // Scheduling
  const getDefaultDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  };

  const [scheduledAt, setScheduledAt] = useState(getDefaultDate());
  const [publishNow, setPublishNow] = useState(true);
  const [platforms, setPlatforms] = useState<string[]>(['youtube', 'instagram', 'tiktok']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const safeRevoke = (url: string | null) => {
    if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  };

  useEffect(() => {
    return () => {
      safeRevoke(verticalThumbnailPreview);
      safeRevoke(horizontalThumbnailPreview);
    };
  }, [verticalThumbnailPreview, horizontalThumbnailPreview]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, '');
      if (!title) {
        setTitle(nameWithoutExt);
      }
      if (!youtubeTitle) {
        setYoutubeTitle(nameWithoutExt);
      }
    }
  };

  const handleVerticalThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      safeRevoke(verticalThumbnailPreview);
      setVerticalThumbnail(selected);
      setVerticalThumbnailPreview(URL.createObjectURL(selected));
    }
  };

  const handleRemoveVerticalThumb = () => {
    safeRevoke(verticalThumbnailPreview);
    setVerticalThumbnail(null);
    setVerticalThumbnailPreview(null);
    if (verticalThumbInputRef.current) verticalThumbInputRef.current.value = '';
  };

  const handleHorizontalThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      safeRevoke(horizontalThumbnailPreview);
      setHorizontalThumbnail(selected);
      setHorizontalThumbnailPreview(URL.createObjectURL(selected));
    }
  };

  const handleRemoveHorizontalThumb = () => {
    safeRevoke(horizontalThumbnailPreview);
    setHorizontalThumbnail(null);
    setHorizontalThumbnailPreview(null);
    if (horizontalThumbInputRef.current) horizontalThumbInputRef.current.value = '';
  };

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return;
      const next = platforms.filter((item) => item !== p);
      setPlatforms(next);
      if (activePlatformTab === p) {
        setActivePlatformTab(next[0] as any);
      }
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Por favor, selecione um arquivo de vídeo (.mp4 ou .mov).');
      setActiveMainTab('media');
      return;
    }
    const effectiveTitle = (youtubeTitle || title).trim();
    if (!effectiveTitle) {
      setErrorMessage('Por favor, informe o título da publicação.');
      setActiveMainTab('social');
      return;
    }
    if (platforms.length === 0) {
      setErrorMessage('Por favor, selecione ao menos uma plataforma de destino.');
      setActiveMainTab('social');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', effectiveTitle);
      const effectiveCaption = (youtubeDescription || caption || instagramCaption || tiktokCaption).trim();
      formData.append('caption', effectiveCaption);
      formData.append('scheduled_at', publishNow ? new Date().toISOString() : new Date(scheduledAt).toISOString());
      formData.append('platforms', JSON.stringify(platforms));
      formData.append('publish_now', publishNow.toString());

      if (verticalThumbnail) formData.append('thumbnail', verticalThumbnail);
      if (horizontalThumbnail) formData.append('youtube_thumbnail', horizontalThumbnail);

      if (instagramCaption) formData.append('instagram_caption', instagramCaption.trim());
      if (instagramHashtags) formData.append('instagram_hashtags', instagramHashtags.trim());
      if (youtubeTitle) formData.append('youtube_title', youtubeTitle.trim());
      if (youtubeDescription) formData.append('youtube_description', youtubeDescription.trim());
      if (youtubeTags) formData.append('youtube_tags', youtubeTags.trim());
      if (youtubeVideoType) formData.append('youtube_video_type', youtubeVideoType);
      if (youtubeRelatedVideo) formData.append('youtube_related_video', youtubeRelatedVideo.trim());
      if (tiktokCaption) formData.append('tiktok_caption', tiktokCaption.trim());
      if (tiktokHashtags) formData.append('tiktok_hashtags', tiktokHashtags.trim());

      const createdPost = await api.createPost(formData);
      onSuccess(createdPost);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao agendar publicação.';
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveTitle = (youtubeTitle || title).trim();

  return (
    <div
      data-testid="video-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Publicar Conteúdo Multi-Redes</h2>
              <p className="text-xs text-slate-400">Poste simultaneamente no Instagram Reels, YouTube e TikTok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="btn-close-upload-modal"
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Superior de Abas Principais (3 Abas Agrupadas) */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 pt-2.5 shrink-0 flex items-center gap-2 overflow-x-auto">
          {/* Aba 1: Mídia */}
          <button
            type="button"
            onClick={() => setActiveMainTab('media')}
            data-testid="main-tab-media"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-t border-x transition-all shrink-0 ${
              activeMainTab === 'media'
                ? 'bg-slate-900 border-slate-700 text-pink-400 shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>1. Mídia (Vídeo e Capas)</span>
            {file && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>

          {/* Aba 2: Redes */}
          <button
            type="button"
            onClick={() => setActiveMainTab('social')}
            data-testid="main-tab-social"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-t border-x transition-all shrink-0 ${
              activeMainTab === 'social'
                ? 'bg-slate-900 border-slate-700 text-purple-400 shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>2. Personalização das Redes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {platforms.length}
            </span>
          </button>

          {/* Aba 3: Agendamento */}
          <button
            type="button"
            onClick={() => setActiveMainTab('schedule')}
            data-testid="main-tab-schedule"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-t border-x transition-all shrink-0 ${
              activeMainTab === 'schedule'
                ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>3. Agendamento & Publicar</span>
          </button>
        </div>

        {/* Form Body com scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Conteúdo da Aba 1: Mídia */}
            <div className={activeMainTab === 'media' ? 'block' : 'hidden'}>
              <MediaUploadTab
                file={file}
                previewUrl={previewUrl}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                verticalThumbnail={verticalThumbnail}
                verticalThumbnailPreview={verticalThumbnailPreview}
                verticalThumbInputRef={verticalThumbInputRef}
                handleVerticalThumbChange={handleVerticalThumbChange}
                handleRemoveVerticalThumb={handleRemoveVerticalThumb}
                horizontalThumbnail={horizontalThumbnail}
                horizontalThumbnailPreview={horizontalThumbnailPreview}
                horizontalThumbInputRef={horizontalThumbInputRef}
                handleHorizontalThumbChange={handleHorizontalThumbChange}
                handleRemoveHorizontalThumb={handleRemoveHorizontalThumb}
              />
            </div>

            {/* Conteúdo da Aba 2: Redes */}
            <div className={activeMainTab === 'social' ? 'block' : 'hidden'}>
              <SocialNetworksTab
                platforms={platforms}
                togglePlatform={togglePlatform}
                activePlatformTab={activePlatformTab}
                setActivePlatformTab={setActivePlatformTab}
                youtubeTitle={youtubeTitle}
                setYoutubeTitle={setYoutubeTitle}
                title={title}
                setTitle={setTitle}
                youtubeDescription={youtubeDescription}
                setYoutubeDescription={setYoutubeDescription}
                caption={caption}
                setCaption={setCaption}
                youtubeTags={youtubeTags}
                setYoutubeTags={setYoutubeTags}
                youtubeVideoType={youtubeVideoType}
                setYoutubeVideoType={setYoutubeVideoType}
                youtubeRelatedVideo={youtubeRelatedVideo}
                setYoutubeRelatedVideo={setYoutubeRelatedVideo}
                isSubmitting={isSubmitting}
                instagramCaption={instagramCaption}
                setInstagramCaption={setInstagramCaption}
                instagramHashtags={instagramHashtags}
                setInstagramHashtags={setInstagramHashtags}
                tiktokCaption={tiktokCaption}
                setTiktokCaption={setTiktokCaption}
                tiktokHashtags={tiktokHashtags}
                setTiktokHashtags={setTiktokHashtags}
                setExpandedField={setExpandedField}
              />
            </div>

            {/* Conteúdo da Aba 3: Agendamento */}
            <div className={activeMainTab === 'schedule' ? 'block' : 'hidden'}>
              <ScheduleTab
                publishNow={publishNow}
                setPublishNow={setPublishNow}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
                file={file}
                verticalThumbnail={verticalThumbnail}
                horizontalThumbnail={horizontalThumbnail}
                platforms={platforms}
                effectiveTitle={effectiveTitle}
                youtubeVideoType={youtubeVideoType}
              />
            </div>
          </div>

          {/* Footer com Navegação e Submissão */}
          <div className="pt-6 border-t border-slate-800/80 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Mensagem de Erro do Rodapé */}
            <div className="w-full sm:w-auto">
              {errorMessage && (
                <div
                  data-testid="footer-error-message"
                  className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
              {/* Botão Voltar */}
              {activeMainTab !== 'media' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeMainTab === 'schedule') setActiveMainTab('social');
                    else if (activeMainTab === 'social') setActiveMainTab('media');
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              )}

              {/* Botão Próximo */}
              {activeMainTab !== 'schedule' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeMainTab === 'media') setActiveMainTab('social');
                    else if (activeMainTab === 'social') setActiveMainTab('schedule');
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : null}

              {/* Botão Cancelar */}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
              >
                Cancelar
              </button>

              {/* Botão Enviar / Agendar */}
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="submit-schedule-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-pink-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>{publishNow ? 'Publicar Agora' : 'Confirmar Agendamento'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal / Overlay de Campo Maximizado */}
      <ExpandedFieldModal
        expandedField={expandedField}
        onClose={() => setExpandedField(null)}
        onUpdateValue={(val) => {
          if (expandedField?.onChange) {
            expandedField.onChange(val);
          }
          if (expandedField) {
            setExpandedField({
              ...expandedField,
              value: val,
            });
          }
        }}
      />
    </div>
  );
};
