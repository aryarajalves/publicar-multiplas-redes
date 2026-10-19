import React from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Instagram,
  Youtube,
  Check,
} from 'lucide-react';
import { FrameCaptureControl } from './FrameCaptureControl';

interface MediaUploadTabProps {
  file: File | null;
  previewUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  verticalThumbnail: File | null;
  verticalThumbnailPreview: string | null;
  verticalThumbInputRef: React.RefObject<HTMLInputElement>;
  handleVerticalThumbChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveVerticalThumb: () => void;
  horizontalThumbnail: File | null;
  horizontalThumbnailPreview: string | null;
  horizontalThumbInputRef: React.RefObject<HTMLInputElement>;
  handleHorizontalThumbChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveHorizontalThumb: () => void;
  capturedFrame: File | null;
  capturedFramePreview: string | null;
  capturedFrameTime: number | null;
  handleCaptureFrame: (file: File, previewUrl: string, timeSec: number) => void;
  handleRemoveCapturedFrame: () => void;
  handleApplyFrameToVertical: () => void;
  handleApplyFrameToHorizontal: () => void;
}

export const MediaUploadTab: React.FC<MediaUploadTabProps> = ({
  file: _file,
  previewUrl,
  videoRef,
  fileInputRef,
  handleFileChange,
  verticalThumbnail,
  verticalThumbnailPreview,
  verticalThumbInputRef,
  handleVerticalThumbChange,
  handleRemoveVerticalThumb,
  horizontalThumbnail,
  horizontalThumbnailPreview,
  horizontalThumbInputRef,
  handleHorizontalThumbChange,
  handleRemoveHorizontalThumb,
  capturedFrame,
  capturedFramePreview,
  capturedFrameTime,
  handleCaptureFrame,
  handleRemoveCapturedFrame,
  handleApplyFrameToVertical,
  handleApplyFrameToHorizontal,
}) => {
  return (
    <div className="space-y-5 animate-fade-in" data-testid="media-upload-tab-content">
      {/* 1. Dropzone de Vídeo */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Arquivo de Vídeo (Reels / Shorts / TikTok) *
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
          data-testid="file-input"
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-200 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white shadow-xs transition-colors"
              >
                Trocar Vídeo
              </button>
            </div>

            {/* Controle de Captura de Frame do Vídeo */}
            <FrameCaptureControl
              videoRef={videoRef}
              capturedFrame={capturedFrame}
              capturedFramePreview={capturedFramePreview}
              capturedFrameTime={capturedFrameTime}
              onCaptureFrame={handleCaptureFrame}
              onRemoveFrame={handleRemoveCapturedFrame}
              onApplyToVertical={handleApplyFrameToVertical}
              onApplyToHorizontal={handleApplyFrameToHorizontal}
            />
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#ea384c] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white hover:bg-slate-50 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#ea384c] mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Clique para selecionar o vídeo
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Formatos suportados: MP4, MOV, WEBM (até 500MB)
            </p>
          </div>
        )}
      </div>

      {/* 2. Upload de Capas / Thumbnails (Vertical e Horizontal) */}
      <div
        className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
        data-testid="thumbnails-upload-section"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Capas / Thumbnails do Vídeo</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium lowercase">
                opcional
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Envie capas personalizadas para formatos verticais (Reels/TikTok/Shorts) e/ou formato horizontal (YouTube widescreen).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Capa Vertical (9:16) */}
          <div
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs"
            data-testid="vertical-thumbnail-card"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-pink-600 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Capa Vertical (9:16)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 font-medium">
                  Reels • Shorts • TikTok
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ideal para vídeos em tela cheia no formato vertical (ex: 1080x1920).
              </p>
            </div>

            <input
              type="file"
              ref={verticalThumbInputRef}
              onChange={handleVerticalThumbChange}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              data-testid="vertical-thumb-input"
              className="hidden"
            />

            {verticalThumbnailPreview ? (
              <div
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                data-testid="vertical-thumb-preview-container"
              >
                <div className="w-14 h-24 rounded-md overflow-hidden bg-black border border-pink-300 shrink-0">
                  <img
                    src={verticalThumbnailPreview}
                    alt="Preview Capa Vertical"
                    data-testid="vertical-thumb-preview-img"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Capa Vertical Selecionada</span>
                  </div>
                  <p className="text-[11px] text-slate-700 truncate" title={verticalThumbnail?.name}>
                    {verticalThumbnail?.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {verticalThumbnail ? `${(verticalThumbnail.size / 1024).toFixed(0)} KB` : ''}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => verticalThumbInputRef.current?.click()}
                      data-testid="btn-change-vertical-thumb"
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      Trocar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVerticalThumb}
                      data-testid="btn-remove-vertical-thumb"
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[11px] font-medium text-rose-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => verticalThumbInputRef.current?.click()}
                data-testid="vertical-thumb-dropzone"
                className="w-full h-28 border border-dashed border-slate-300 hover:border-pink-500 bg-slate-50/70 hover:bg-pink-50/30 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-pink-600 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-pink-500 transition-colors" />
                <span className="text-xs font-semibold">Upload Capa Vertical (9:16)</span>
                <span className="text-[10px] text-slate-400">PNG, JPG ou WEBP</span>
              </button>
            )}
          </div>

          {/* Card 2: Capa Horizontal (16:9) */}
          <div
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs"
            data-testid="horizontal-thumbnail-card"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Capa Horizontal (16:9)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                  YouTube Vídeos Longos
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ideal para formato widescreen tradicional no YouTube (ex: 1280x720).
              </p>
            </div>

            <input
              type="file"
              ref={horizontalThumbInputRef}
              onChange={handleHorizontalThumbChange}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              data-testid="horizontal-thumb-input"
              className="hidden"
            />

            {horizontalThumbnailPreview ? (
              <div
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                data-testid="horizontal-thumb-preview-container"
              >
                <div className="w-28 h-16 rounded-md overflow-hidden bg-black border border-red-300 shrink-0">
                  <img
                    src={horizontalThumbnailPreview}
                    alt="Preview Capa Horizontal"
                    data-testid="horizontal-thumb-preview-img"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Capa YouTube Selecionada</span>
                  </div>
                  <p className="text-[11px] text-slate-700 truncate" title={horizontalThumbnail?.name}>
                    {horizontalThumbnail?.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {horizontalThumbnail ? `${(horizontalThumbnail.size / 1024).toFixed(0)} KB` : ''}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => horizontalThumbInputRef.current?.click()}
                      data-testid="btn-change-horizontal-thumb"
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      Trocar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveHorizontalThumb}
                      data-testid="btn-remove-horizontal-thumb"
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[11px] font-medium text-rose-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => horizontalThumbInputRef.current?.click()}
                data-testid="horizontal-thumb-dropzone"
                className="w-full h-28 border border-dashed border-slate-300 hover:border-red-500 bg-slate-50/70 hover:bg-red-50/30 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-red-600 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                <span className="text-xs font-semibold">Upload Capa YouTube (16:9)</span>
                <span className="text-[10px] text-slate-400">PNG, JPG ou WEBP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
