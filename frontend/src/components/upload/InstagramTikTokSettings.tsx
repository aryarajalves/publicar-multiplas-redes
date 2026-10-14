import React from 'react';
import { Maximize2 } from 'lucide-react';

interface InstagramSettingsProps {
  instagramCaption: string;
  setInstagramCaption: (val: string) => void;
  caption: string;
  instagramHashtags?: string;
  setInstagramHashtags?: (val: string) => void;
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
  setExpandedField,
}) => {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="content-tab-instagram">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">
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
              className="p-1 rounded text-pink-400 hover:text-white hover:bg-pink-900/40 transition-colors"
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
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors resize-none leading-relaxed min-h-[160px]"
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
          <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
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
              className="p-1 rounded text-cyan-400 hover:text-white hover:bg-cyan-900/40 transition-colors"
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
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none leading-relaxed min-h-[160px]"
        />
      </div>
    </div>
  );
};
