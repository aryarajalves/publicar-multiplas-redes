import React from 'react';
import { Maximize2 } from 'lucide-react';
import { InstagramAudioItem, InstagramProfile } from '../../types';
import { InstagramTrialReelsSelector } from './InstagramTrialReelsSelector';
import { InstagramMusicSelector } from './InstagramMusicSelector';

interface InstagramSettingsProps {
  instagramCaption: string;
  setInstagramCaption: (val: string) => void;
  caption: string;
  instagramHashtags?: string;
  setInstagramHashtags?: (val: string) => void;
  igProfile?: InstagramProfile | null;
  selectedAudio?: InstagramAudioItem | null;
  onSelectAudio?: (audio: InstagramAudioItem | null) => void;
  audioVolume?: number;
  setAudioVolume?: (val: number) => void;
  videoVolume?: number;
  setVideoVolume?: (val: number) => void;
  isTrialReel?: boolean;
  setIsTrialReel?: (val: boolean) => void;
  graduationStrategy?: 'MANUAL' | 'SS_PERFORMANCE';
  setGraduationStrategy?: (val: 'MANUAL' | 'SS_PERFORMANCE') => void;
  setExpandedField: (field: {
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null) => void;
}

export const InstagramSettings: React.FC<InstagramSettingsProps> = ({
  instagramCaption,
  setInstagramCaption,
  caption,
  igProfile = null,
  selectedAudio = null,
  onSelectAudio = () => {},
  audioVolume = 80,
  setAudioVolume = () => {},
  videoVolume = 50,
  setVideoVolume = () => {},
  isTrialReel = false,
  setIsTrialReel = () => {},
  graduationStrategy = 'MANUAL',
  setGraduationStrategy = () => {},
  setExpandedField,
}) => {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="content-tab-instagram">
      {/* 1. Reels de Teste (Trial Reels) com restrição de 1.000 seguidores */}
      <InstagramTrialReelsSelector
        igProfile={igProfile}
        isTrialReel={isTrialReel}
        setIsTrialReel={setIsTrialReel}
        graduationStrategy={graduationStrategy}
        setGraduationStrategy={setGraduationStrategy}
      />

      {/* 2. Seletor de Música do Instagram */}
      <InstagramMusicSelector
        selectedAudio={selectedAudio}
        onSelectAudio={onSelectAudio}
        audioVolume={audioVolume}
        setAudioVolume={setAudioVolume}
        videoVolume={videoVolume}
        setVideoVolume={setVideoVolume}
      />

      {/* 3. Legenda do Instagram Reels */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-pink-700 uppercase tracking-wider">
            Legenda do Instagram Reels
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Se vazio, usa a legenda geral</span>
            <button
              type="button"
              onClick={() =>
                setExpandedField({
                  title: 'Legenda do Instagram Reels',
                  subtitle: 'Edição expandida da legenda e hashtags para o Instagram',
                  value: instagramCaption || caption,
                  onChange: setInstagramCaption,
                })
              }
              data-testid="btn-maximize-instagram-caption"
              className="p-1 rounded text-pink-600 hover:text-pink-700 hover:bg-pink-50 transition-colors"
              title="Maximizar legenda"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea
          value={instagramCaption}
          onChange={(e) => setInstagramCaption(e.target.value)}
          rows={7}
          placeholder="Digite a legenda e as hashtags do seu Reel (ou deixe em branco para usar a Legenda Geral)..."
          data-testid="instagram-caption-input"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors resize-none leading-relaxed min-h-[160px]"
        />
      </div>
    </div>
  );
};

interface TikTokSettingsProps {
  tiktokCaption: string;
  setTiktokCaption: (val: string) => void;
  caption: string;
  tiktokHashtags?: string;
  setTiktokHashtags?: (val: string) => void;
  setExpandedField: (field: {
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null) => void;
}

export const TikTokSettings: React.FC<TikTokSettingsProps> = ({
  tiktokCaption,
  setTiktokCaption,
  caption,
  setExpandedField,
}) => {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="content-tab-tiktok">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
            Legenda do TikTok
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Se vazio, usa a legenda geral</span>
            <button
              type="button"
              onClick={() =>
                setExpandedField({
                  title: 'Legenda do TikTok',
                  subtitle: 'Edição expandida da legenda e hashtags para o TikTok',
                  value: tiktokCaption || caption,
                  onChange: setTiktokCaption,
                })
              }
              data-testid="btn-maximize-tiktok-caption"
              className="p-1 rounded text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
              title="Maximizar legenda"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea
          value={tiktokCaption}
          onChange={(e) => setTiktokCaption(e.target.value)}
          rows={7}
          placeholder="Digite a legenda e as hashtags do seu vídeo no TikTok (ou deixe em branco para usar a Legenda Geral)..."
          data-testid="tiktok-caption-input"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors resize-none leading-relaxed min-h-[160px]"
        />
      </div>
    </div>
  );
};
