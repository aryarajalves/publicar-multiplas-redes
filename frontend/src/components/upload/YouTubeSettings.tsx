import React from 'react';
import {
  Youtube,
  Film,
  Video,
  Check,
  Maximize2,
} from 'lucide-react';
import { YouTubeEndScreenSelect } from '../YouTubeEndScreenSelect';

interface YouTubeSettingsProps {
  youtubeVideoType: string;
  setYoutubeVideoType: (val: string) => void;
  youtubeTitle: string;
  setYoutubeTitle: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  youtubeDescription: string;
  setYoutubeDescription: (val: string) => void;
  caption: string;
  setCaption: (val: string) => void;
  youtubeRelatedVideo: string;
  setYoutubeRelatedVideo: (val: string) => void;
  youtubeTags: string;
  setYoutubeTags: (val: string) => void;
  isSubmitting: boolean;
  setExpandedField: (field: {
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null) => void;
}

export const YouTubeSettings: React.FC<YouTubeSettingsProps> = ({
  youtubeVideoType,
  setYoutubeVideoType,
  youtubeTitle,
  setYoutubeTitle,
  title,
  setTitle,
  youtubeDescription,
  setYoutubeDescription,
  caption,
  setCaption,
  youtubeRelatedVideo,
  setYoutubeRelatedVideo,
  youtubeTags,
  setYoutubeTags,
  isSubmitting,
  setExpandedField,
}) => {
  return (
    <div className="space-y-5 animate-fade-in" data-testid="content-tab-youtube">
      {/* 1. Seleção de Formato: Vídeo Longo vs Shorts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <Youtube className="w-3.5 h-3.5" />
            <span>Formato do Vídeo no YouTube *</span>
          </label>
          <span className="text-[11px] text-slate-500">
            Atual: <strong className="text-red-700">{youtubeVideoType === 'Vídeo Padrão' ? 'Vídeo Longo (16:9)' : 'Shorts (9:16)'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setYoutubeVideoType('Vídeo Padrão')}
            data-testid="btn-youtube-type-long"
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              youtubeVideoType === 'Vídeo Padrão'
                ? 'bg-red-50/70 border-red-500 text-slate-900 ring-1 ring-red-500/40 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${youtubeVideoType === 'Vídeo Padrão' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
              <Film className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold flex items-center justify-between">
                <span>🎬 Vídeo Longo (16:9)</span>
                {youtubeVideoType === 'Vídeo Padrão' && <Check className="w-4 h-4 text-red-600" />}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Widescreen tradicional no canal</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setYoutubeVideoType('Shorts')}
            data-testid="btn-youtube-type-shorts"
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              youtubeVideoType === 'Shorts'
                ? 'bg-red-50/70 border-red-500 text-slate-900 ring-1 ring-red-500/40 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${youtubeVideoType === 'Shorts' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
              <Video className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold flex items-center justify-between">
                <span>⚡ Shorts (Vertical 9:16)</span>
                {youtubeVideoType === 'Shorts' && <Check className="w-4 h-4 text-red-600" />}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Feed de vídeos curtos do YouTube</p>
            </div>
          </button>
        </div>

        <select
          value={youtubeVideoType}
          onChange={(e) => setYoutubeVideoType(e.target.value)}
          data-testid="youtube-video-type-select"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="Shorts">⚡ Shorts (Vertical)</option>
          <option value="Vídeo Padrão">🎬 Vídeo Longo (Horizontal 16:9)</option>
        </select>
      </div>

      {/* 2. Título */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Título do Vídeo no YouTube *
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {(youtubeTitle || title).length}/100
          </span>
        </div>
        <input
          type="text"
          maxLength={100}
          value={youtubeTitle || title}
          onChange={(e) => {
            const val = e.target.value;
            setYoutubeTitle(val);
            setTitle(val);
          }}
          placeholder="Ex: Como Aumentar Suas Vendas com Essa Estratégia"
          data-testid="youtube-title-input"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors font-medium"
        />
      </div>

      {/* 3. Descrição */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Descrição do Vídeo no YouTube
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setExpandedField({
                  title: 'Descrição Detalhada do Vídeo (YouTube)',
                  subtitle: 'Edição expandida da descrição para o YouTube',
                  value: youtubeDescription || caption,
                  onChange: (val) => {
                    setYoutubeDescription(val);
                    setCaption(val);
                  },
                })
              }
              data-testid="btn-maximize-youtube-description"
              className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Maximizar descrição"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea
          value={youtubeDescription || caption}
          onChange={(e) => {
            const val = e.target.value;
            setYoutubeDescription(val);
            setCaption(val);
          }}
          rows={6}
          placeholder="Descrição completa com links, formatação, tópicos e detalhes adicionais..."
          data-testid="youtube-description-input"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors resize-none leading-relaxed min-h-[140px]"
        />
      </div>

      {/* 4. Tela Final */}
      <YouTubeEndScreenSelect
        value={youtubeRelatedVideo}
        onChange={setYoutubeRelatedVideo}
        disabled={isSubmitting}
      />

      {/* 5. Tags */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Tags de Busca (Separadas por vírgula)
          </label>
          <div className="flex items-center gap-2">
            <span
              data-testid="youtube-tags-counter"
              className={`text-[11px] font-mono transition-colors ${
                youtubeTags.length >= 500
                  ? 'text-rose-600 font-bold'
                  : youtubeTags.length >= 450
                  ? 'text-amber-600 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {youtubeTags.length}/500
            </span>
            <button
              type="button"
              onClick={() =>
                setExpandedField({
                  title: 'Tags de Busca do YouTube',
                  subtitle: 'Tags separadas por vírgula (máximo 500 caracteres)',
                  value: youtubeTags,
                  onChange: (val) => {
                    if (val.length <= 500) {
                      setYoutubeTags(val);
                    }
                  },
                  testId: 'expanded-youtube-tags',
                })
              }
              data-testid="btn-maximize-youtube-tags"
              className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Maximizar tags de busca"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <input
          type="text"
          maxLength={500}
          value={youtubeTags}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setYoutubeTags(e.target.value);
            }
          }}
          placeholder="marketing, dicas de negocios, reels, shorts, vendas"
          data-testid="youtube-tags-input"
          className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
            youtubeTags.length >= 500
              ? 'border-rose-500 focus:border-rose-600 focus:bg-white'
              : 'border-slate-200 focus:border-red-500 focus:bg-white'
          }`}
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
          <span>Insira uma vírgula depois de cada tag.</span>
          <span>Limite máximo: 500 caracteres</span>
        </div>
      </div>
    </div>
  );
};
