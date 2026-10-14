import React from 'react';
import {
  Instagram,
  Youtube,
  Video,
  Check,
} from 'lucide-react';
import { YouTubeSettings } from './YouTubeSettings';
import { InstagramSettings, TikTokSettings } from './InstagramTikTokSettings';

interface SocialNetworksTabProps {
  platforms: string[];
  togglePlatform: (p: string) => void;
  activePlatformTab: 'youtube' | 'instagram' | 'tiktok';
  setActivePlatformTab: (tab: 'youtube' | 'instagram' | 'tiktok') => void;
  youtubeTitle: string;
  setYoutubeTitle: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  youtubeDescription: string;
  setYoutubeDescription: (val: string) => void;
  caption: string;
  setCaption: (val: string) => void;
  youtubeTags: string;
  setYoutubeTags: (val: string) => void;
  youtubeVideoType: string;
  setYoutubeVideoType: (val: string) => void;
  youtubeRelatedVideo: string;
  setYoutubeRelatedVideo: (val: string) => void;
  isSubmitting: boolean;
  instagramCaption: string;
  setInstagramCaption: (val: string) => void;
  instagramHashtags: string;
  setInstagramHashtags: (val: string) => void;
  tiktokCaption: string;
  setTiktokCaption: (val: string) => void;
  tiktokHashtags: string;
  setTiktokHashtags: (val: string) => void;
  setExpandedField: (field: {
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null) => void;
}

export const SocialNetworksTab: React.FC<SocialNetworksTabProps> = ({
  platforms,
  togglePlatform,
  activePlatformTab,
  setActivePlatformTab,
  youtubeTitle,
  setYoutubeTitle,
  title,
  setTitle,
  youtubeDescription,
  setYoutubeDescription,
  caption,
  setCaption,
  youtubeTags,
  setYoutubeTags,
  youtubeVideoType,
  setYoutubeVideoType,
  youtubeRelatedVideo,
  setYoutubeRelatedVideo,
  isSubmitting,
  instagramCaption,
  setInstagramCaption,
  instagramHashtags,
  setInstagramHashtags,
  tiktokCaption,
  setTiktokCaption,
  tiktokHashtags,
  setTiktokHashtags,
  setExpandedField,
}) => {
  return (
    <div className="space-y-5 animate-fade-in" data-testid="social-networks-tab-content">
      {/* 1. Seleção das Redes de Destino */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Redes de Destino Selecionadas
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Instagram */}
          <button
            type="button"
            onClick={() => togglePlatform('instagram')}
            data-testid="toggle-platform-instagram"
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              platforms.includes('instagram')
                ? 'bg-pink-950/30 border-pink-500/50 text-pink-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Instagram className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-xs font-semibold">Instagram</p>
                <p className="text-[10px] opacity-70">Reels (Primário)</p>
              </div>
            </div>
            {platforms.includes('instagram') && <Check className="w-4 h-4 text-pink-400" />}
          </button>

          {/* YouTube */}
          <button
            type="button"
            onClick={() => togglePlatform('youtube')}
            data-testid="toggle-platform-youtube"
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              platforms.includes('youtube')
                ? 'bg-red-950/30 border-red-500/50 text-red-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Youtube className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-xs font-semibold">YouTube</p>
                <p className="text-[10px] opacity-70">Shorts / Vídeo</p>
              </div>
            </div>
            {platforms.includes('youtube') && <Check className="w-4 h-4 text-red-400" />}
          </button>

          {/* TikTok */}
          <button
            type="button"
            onClick={() => togglePlatform('tiktok')}
            data-testid="toggle-platform-tiktok"
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              platforms.includes('tiktok')
                ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Video className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs font-semibold">TikTok</p>
                <p className="text-[10px] opacity-70">Feed (Auto)</p>
              </div>
            </div>
            {platforms.includes('tiktok') && <Check className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* 2. Personalização por Rede Social */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Personalização de Conteúdo por Rede
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Defina títulos, descrições, tags e telas finais específicos para cada rede.
            </p>
          </div>

          {/* Sub-abas de seleção da rede */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {platforms.includes('youtube') && (
              <button
                type="button"
                onClick={() => setActivePlatformTab('youtube')}
                data-testid="tab-youtube"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activePlatformTab === 'youtube'
                    ? 'bg-red-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-red-300'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </button>
            )}
            {platforms.includes('instagram') && (
              <button
                type="button"
                onClick={() => setActivePlatformTab('instagram')}
                data-testid="tab-instagram"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activePlatformTab === 'instagram'
                    ? 'bg-pink-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-pink-300'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
              </button>
            )}
            {platforms.includes('tiktok') && (
              <button
                type="button"
                onClick={() => setActivePlatformTab('tiktok')}
                data-testid="tab-tiktok"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activePlatformTab === 'tiktok'
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>TikTok</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB: INSTAGRAM */}
        {activePlatformTab === 'instagram' && platforms.includes('instagram') && (
          <InstagramSettings
            instagramCaption={instagramCaption}
            setInstagramCaption={setInstagramCaption}
            caption={caption}
            instagramHashtags={instagramHashtags}
            setInstagramHashtags={setInstagramHashtags}
            setExpandedField={setExpandedField}
          />
        )}

        {/* TAB: YOUTUBE */}
        {activePlatformTab === 'youtube' && platforms.includes('youtube') && (
          <YouTubeSettings
            youtubeVideoType={youtubeVideoType}
            setYoutubeVideoType={setYoutubeVideoType}
            youtubeTitle={youtubeTitle}
            setYoutubeTitle={setYoutubeTitle}
            title={title}
            setTitle={setTitle}
            youtubeDescription={youtubeDescription}
            setYoutubeDescription={setYoutubeDescription}
            caption={caption}
            setCaption={setCaption}
            youtubeRelatedVideo={youtubeRelatedVideo}
            setYoutubeRelatedVideo={setYoutubeRelatedVideo}
            youtubeTags={youtubeTags}
            setYoutubeTags={setYoutubeTags}
            isSubmitting={isSubmitting}
            setExpandedField={setExpandedField}
          />
        )}

        {/* TAB: TIKTOK */}
        {activePlatformTab === 'tiktok' && platforms.includes('tiktok') && (
          <TikTokSettings
            tiktokCaption={tiktokCaption}
            setTiktokCaption={setTiktokCaption}
            caption={caption}
            tiktokHashtags={tiktokHashtags}
            setTiktokHashtags={setTiktokHashtags}
            setExpandedField={setExpandedField}
          />
        )}
      </div>
    </div>
  );
};
