import React from 'react';
import { Camera, Image as ImageIcon, Sparkles, Check, AlertCircle } from 'lucide-react';

export type CoverSourceType = 'thumbnail' | 'frame' | 'auto';

interface Props {
  platformName: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  selectedSource: CoverSourceType;
  onChangeSource: (source: CoverSourceType) => void;
  verticalThumbnailPreview: string | null;
  horizontalThumbnailPreview: string | null;
  capturedFramePreview: string | null;
  capturedFrameTime: number | null;
  onGoToMediaTab?: () => void;
}

export const NetworkCoverSelector: React.FC<Props> = ({
  platformName,
  platform,
  selectedSource,
  onChangeSource,
  verticalThumbnailPreview,
  horizontalThumbnailPreview,
  capturedFramePreview,
  capturedFrameTime,
  onGoToMediaTab,
}) => {
  // Para YouTube, prefere a horizontal caso exista; para Instagram/TikTok, prefere a vertical
  const customThumbnailPreview = platform === 'youtube'
    ? (horizontalThumbnailPreview || verticalThumbnailPreview)
    : (verticalThumbnailPreview || horizontalThumbnailPreview);

  const formatSeconds = (sec: number | null) => {
    if (sec === null || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasAnyCover = Boolean(customThumbnailPreview || capturedFramePreview);

  return (
    <div
      data-testid={`cover-selector-${platform}`}
      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <Camera className="w-4 h-4 text-[#ea384c]" />
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Capa da Publicação ({platformName})
            </h5>
            <p className="text-[11px] text-slate-500">
              Escolha qual imagem será exibida como thumbnail oficial no {platformName}.
            </p>
          </div>
        </div>

        {selectedSource !== 'auto' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            Personalizada
          </span>
        )}
      </div>

      {/* Grid de Opções (Frame vs Thumbnail vs Automático) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Opção 1: Frame do Vídeo */}
        <div
          onClick={() => {
            if (capturedFramePreview) {
              onChangeSource('frame');
            } else if (onGoToMediaTab) {
              onGoToMediaTab();
            }
          }}
          data-testid={`opt-cover-frame-${platform}`}
          className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selectedSource === 'frame'
              ? 'bg-white border-[#ea384c] ring-2 ring-[#ea384c]/20 shadow-xs'
              : capturedFramePreview
              ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              : 'bg-slate-100/60 border-dashed border-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#ea384c]" />
                <span>Frame do Vídeo</span>
              </span>
              {selectedSource === 'frame' && (
                <span className="w-4 h-4 rounded-full bg-[#ea384c] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>

            {capturedFramePreview ? (
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                  <img
                    src={capturedFramePreview}
                    alt="Frame capturado"
                    className="max-w-full max-h-full object-contain rounded"
                    loading="eager"
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  <p className="font-semibold text-slate-700">Frame aos {formatSeconds(capturedFrameTime)}</p>
                  <p className="text-slate-400 mt-0.5">Capturado do player</p>
                  <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200/60">
                    Visualização Completa
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-[10px] text-slate-500">
                <p>Nenhum frame capturado.</p>
                <span className="text-[#ea384c] font-semibold hover:underline block mt-0.5">
                  Capturar no player &rarr;
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Opção 2: Thumbnail Enviada */}
        <div
          onClick={() => {
            if (customThumbnailPreview) {
              onChangeSource('thumbnail');
            } else if (onGoToMediaTab) {
              onGoToMediaTab();
            }
          }}
          data-testid={`opt-cover-thumb-${platform}`}
          className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selectedSource === 'thumbnail'
              ? 'bg-white border-[#ea384c] ring-2 ring-[#ea384c]/20 shadow-xs'
              : customThumbnailPreview
              ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              : 'bg-slate-100/60 border-dashed border-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Thumbnail Enviada</span>
              </span>
              {selectedSource === 'thumbnail' && (
                <span className="w-4 h-4 rounded-full bg-[#ea384c] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>

            {customThumbnailPreview ? (
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                  <img
                    src={customThumbnailPreview}
                    alt="Thumbnail enviada"
                    className="max-w-full max-h-full object-contain rounded"
                    loading="eager"
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  <p className="font-semibold text-slate-700">Arquivo enviado</p>
                  <p className="text-slate-400 mt-0.5">{platform === 'youtube' && horizontalThumbnailPreview ? '16:9 Widescreen' : '9:16 Vertical'}</p>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-[10px] text-slate-500">
                <p>Nenhuma capa enviada.</p>
                <span className="text-[#ea384c] font-semibold hover:underline block mt-0.5">
                  Fazer upload na Aba 1 &rarr;
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Opção 3: Automático da Rede */}
        <div
          onClick={() => onChangeSource('auto')}
          data-testid={`opt-cover-auto-${platform}`}
          className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selectedSource === 'auto'
              ? 'bg-white border-[#ea384c] ring-2 ring-[#ea384c]/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Padrão da Rede</span>
              </span>
              {selectedSource === 'auto' && (
                <span className="w-4 h-4 rounded-full bg-[#ea384c] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>

            <div className="py-2 text-[10px] text-slate-500 leading-snug">
              <p className="font-medium text-slate-700">Automático do {platformName}</p>
              <p className="text-slate-400 mt-0.5">A plataforma gerará o frame padrão automaticamente.</p>
            </div>
          </div>
        </div>
      </div>

      {!hasAnyCover && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Dica: capture um frame no player do vídeo ou faça upload de capa na aba 1 para personalizar.</span>
        </div>
      )}
    </div>
  );
};
