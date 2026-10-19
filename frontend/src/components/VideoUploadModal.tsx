import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Post, InstagramAudioItem, InstagramProfile } from '../types';
import { MediaUploadTab } from './upload/MediaUploadTab';
import { SocialNetworksTab } from './upload/SocialNetworksTab';
import { ScheduleTab } from './upload/ScheduleTab';
import { ExpandedFieldModal } from './upload/ExpandedFieldModal';
import { UploadModalHeader } from './upload/UploadModalHeader';
import { UploadModalFooter } from './upload/UploadModalFooter';
import { UploadModalTabsNav } from './upload/UploadModalTabsNav';
import { PublishConfirmModal } from './upload/PublishConfirmModal';
import { useUploadMediaState } from './upload/useUploadMediaState';
import { AlertCircle } from 'lucide-react';

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

  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('media');
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

  // Instagram Perfil, Música e Reels de Teste (Trial Reels)
  const [igProfile, setIgProfile] = useState<InstagramProfile | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<InstagramAudioItem | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(80);
  const [videoVolume, setVideoVolume] = useState<number>(50);
  const [isTrialReel, setIsTrialReel] = useState<boolean>(false);
  const [graduationStrategy, setGraduationStrategy] = useState<'MANUAL' | 'SS_PERFORMANCE'>('MANUAL');

  useEffect(() => {
    if (isOpen && typeof api.getInstagramProfile === 'function') {
      api
        .getInstagramProfile()
        .then((profile) => {
          if (profile) {
            setIgProfile(profile);
            if (!profile.trial_reels_eligible) {
              setIsTrialReel(false);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Estado modularizado de Mídia, Thumbnails e Frame
  const {
    fileInputRef,
    file,
    previewUrl,
    verticalThumbnail,
    verticalThumbnailPreview,
    verticalThumbInputRef,
    horizontalThumbnail,
    horizontalThumbnailPreview,
    horizontalThumbInputRef,
    videoRef,
    capturedFrame,
    capturedFramePreview,
    capturedFrameTime,
    youtubeCoverSource,
    setYoutubeCoverSource,
    instagramCoverSource,
    setInstagramCoverSource,
    tiktokCoverSource,
    setTiktokCoverSource,
    handleCaptureFrame,
    handleRemoveCapturedFrame,
    handleApplyFrameToVertical,
    handleApplyFrameToHorizontal,
    handleFileChange,
    handleVerticalThumbChange,
    handleRemoveVerticalThumb,
    handleHorizontalThumbChange,
    handleRemoveHorizontalThumb,
  } = useUploadMediaState(title, setTitle, youtubeTitle, setYoutubeTitle);

  const [activePlatformTab, setActivePlatformTab] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [expandedField, setExpandedField] = useState<{
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null>(null);

  const getDefaultDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  };

  const [scheduledAt, setScheduledAt] = useState(getDefaultDate());
  const [publishNow, setPublishNow] = useState(true);
  const [platforms, setPlatforms] = useState<string[]>(['youtube', 'instagram', 'tiktok']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
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

    setErrorMessage(null);
    if (publishNow) {
      setIsPublishConfirmOpen(true);
      return;
    }
    executeSubmit();
  };

  const executeSubmit = async () => {
    const effectiveTitle = (youtubeTitle || title).trim();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('video', file!);
      formData.append('title', effectiveTitle);
      const effectiveCaption = (youtubeDescription || caption || instagramCaption || tiktokCaption).trim();
      formData.append('caption', effectiveCaption);
      formData.append('scheduled_at', publishNow ? new Date().toISOString() : new Date(scheduledAt).toISOString());
      formData.append('platforms', JSON.stringify(platforms));

      let finalVerticalCover: File | null = null;
      let finalYoutubeCover: File | null = null;

      if (youtubeCoverSource === 'frame' && capturedFrame) {
        finalYoutubeCover = capturedFrame;
      } else if (youtubeCoverSource === 'thumbnail' || (!capturedFrame && horizontalThumbnail)) {
        finalYoutubeCover = horizontalThumbnail || verticalThumbnail;
      } else if (horizontalThumbnail && youtubeCoverSource !== 'frame') {
        finalYoutubeCover = horizontalThumbnail;
      }

      const wantsFrameVertical =
        (instagramCoverSource === 'frame' && platforms.includes('instagram')) ||
        (tiktokCoverSource === 'frame' && platforms.includes('tiktok'));
      const wantsThumbVertical =
        (instagramCoverSource === 'thumbnail' && platforms.includes('instagram')) ||
        (tiktokCoverSource === 'thumbnail' && platforms.includes('tiktok'));

      if (wantsFrameVertical && capturedFrame) {
        finalVerticalCover = capturedFrame;
      } else if (wantsThumbVertical) {
        finalVerticalCover = verticalThumbnail || horizontalThumbnail;
      } else if (verticalThumbnail && !wantsFrameVertical) {
        finalVerticalCover = verticalThumbnail;
      }

      if (finalVerticalCover) formData.append('thumbnail', finalVerticalCover);
      if (finalYoutubeCover) formData.append('youtube_thumbnail', finalYoutubeCover);

      if (instagramCaption) formData.append('instagram_caption', instagramCaption.trim());
      if (instagramHashtags) formData.append('instagram_hashtags', instagramHashtags.trim());

      // Música do Instagram e Reels de Teste (Trial Reels)
      if (selectedAudio) {
        formData.append('instagram_audio_id', selectedAudio.audio_id);
        formData.append('instagram_audio_title', selectedAudio.title);
        formData.append('instagram_audio_artist', selectedAudio.display_artist || '');
        formData.append('instagram_audio_volume', String(audioVolume));
        formData.append('instagram_video_volume', String(videoVolume));
      }
      if (isTrialReel && igProfile?.trial_reels_eligible) {
        formData.append('instagram_is_trial_reel', 'true');
        formData.append('instagram_trial_graduation_strategy', graduationStrategy);
      }

      if (youtubeTitle) formData.append('youtube_title', youtubeTitle.trim());
      if (youtubeDescription) formData.append('youtube_description', youtubeDescription.trim());
      if (youtubeTags) formData.append('youtube_tags', youtubeTags.trim());
      if (youtubeVideoType) formData.append('youtube_video_type', youtubeVideoType);
      if (youtubeRelatedVideo) formData.append('youtube_related_video', youtubeRelatedVideo.trim());
      if (tiktokCaption) formData.append('tiktok_caption', tiktokCaption.trim());
      if (tiktokHashtags) formData.append('tiktok_hashtags', tiktokHashtags.trim());

      const createdPost = await api.createPost(formData);
      setIsPublishConfirmOpen(false);
      onSuccess(createdPost);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao agendar publicação.';
      setErrorMessage(detail);
      setIsPublishConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveTitle = (youtubeTitle || title).trim();

  return (
    <div
      data-testid="video-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        <UploadModalHeader onClose={onClose} isSubmitting={isSubmitting} igProfile={igProfile} />

        <UploadModalTabsNav
          activeMainTab={activeMainTab}
          setActiveMainTab={setActiveMainTab}
          hasFile={Boolean(file)}
          platformsCount={platforms.length}
        />

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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
                videoRef={videoRef}
                capturedFrame={capturedFrame}
                capturedFramePreview={capturedFramePreview}
                capturedFrameTime={capturedFrameTime}
                handleCaptureFrame={handleCaptureFrame}
                handleRemoveCapturedFrame={handleRemoveCapturedFrame}
                handleApplyFrameToVertical={handleApplyFrameToVertical}
                handleApplyFrameToHorizontal={handleApplyFrameToHorizontal}
              />
            </div>

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
                igProfile={igProfile}
                selectedAudio={selectedAudio}
                onSelectAudio={setSelectedAudio}
                audioVolume={audioVolume}
                setAudioVolume={setAudioVolume}
                videoVolume={videoVolume}
                setVideoVolume={setVideoVolume}
                isTrialReel={isTrialReel}
                setIsTrialReel={setIsTrialReel}
                graduationStrategy={graduationStrategy}
                setGraduationStrategy={setGraduationStrategy}
                tiktokCaption={tiktokCaption}
                setTiktokCaption={setTiktokCaption}
                tiktokHashtags={tiktokHashtags}
                setTiktokHashtags={setTiktokHashtags}
                setExpandedField={setExpandedField}
                youtubeCoverSource={youtubeCoverSource}
                setYoutubeCoverSource={setYoutubeCoverSource}
                instagramCoverSource={instagramCoverSource}
                setInstagramCoverSource={setInstagramCoverSource}
                tiktokCoverSource={tiktokCoverSource}
                setTiktokCoverSource={setTiktokCoverSource}
                verticalThumbnailPreview={verticalThumbnailPreview}
                horizontalThumbnailPreview={horizontalThumbnailPreview}
                capturedFramePreview={capturedFramePreview}
                capturedFrameTime={capturedFrameTime}
                onGoToMediaTab={() => setActiveMainTab('media')}
              />
            </div>

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

          <UploadModalFooter
            errorMessage={errorMessage}
            activeMainTab={activeMainTab}
            setActiveMainTab={setActiveMainTab}
            onClose={onClose}
            isSubmitting={isSubmitting}
            publishNow={publishNow}
          />
        </form>
      </div>

      <ExpandedFieldModal
        expandedField={expandedField}
        onClose={() => setExpandedField(null)}
        onUpdateValue={(val) => {
          if (expandedField?.onChange) expandedField.onChange(val);
          if (expandedField) setExpandedField({ ...expandedField, value: val });
        }}
      />

      <PublishConfirmModal
        isOpen={isPublishConfirmOpen}
        onClose={() => setIsPublishConfirmOpen(false)}
        onConfirm={executeSubmit}
        isLoading={isSubmitting}
        videoTitle={effectiveTitle}
        platforms={platforms}
      />
    </div>
  );
};
