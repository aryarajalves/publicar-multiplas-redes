import React from 'react';
import { Camera, Check, Trash2, ArrowDownRight } from 'lucide-react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  capturedFrame: File | null;
  capturedFramePreview: string | null;
  capturedFrameTime: number | null;
  onCaptureFrame: (file: File, previewUrl: string, timeSeconds: number) => void;
  onRemoveFrame: () => void;
  onApplyToVertical: () => void;
  onApplyToHorizontal: () => void;
}

export const FrameCaptureControl: React.FC<Props> = ({
  videoRef,
  capturedFrame,
  capturedFramePreview,
  capturedFrameTime,
  onCaptureFrame,
  onRemoveFrame,
  onApplyToVertical,
  onApplyToHorizontal,
}) => {
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    // Pausa o vídeo para garantir a captura do frame congelado
    if (!video.paused && typeof video.pause === 'function') {
      video.pause();
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || (video as any).clientWidth || 1080;
      canvas.height = video.videoHeight || (video as any).clientHeight || 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Data URL síncrono para preview que nunca expira ou quebra ao navegar entre abas
      const previewDataUrl = canvas.toDataURL ? canvas.toDataURL('image/jpeg', 0.95) : '';
      const timeSec = Math.floor(video.currentTime || 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const filename = `frame_${timeSec}s_${Date.now()}.jpg`;
          const frameFile = new File([blob], filename, { type: 'image/jpeg' });
          const finalPreview = previewDataUrl || URL.createObjectURL(blob);
          onCaptureFrame(frameFile, finalPreview, timeSec);
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('Erro ao capturar frame do vídeo:', err);
    }
  };

  const formatSeconds = (sec: number | null) => {
    if (sec === null || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3" data-testid="frame-capture-control">
      {/* Botão Flutuante / Barra de Ação no Player */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCapture}
            data-testid="btn-capture-video-frame"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Captura o momento exato em que o vídeo estiver pausado para usar como capa"
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span>{capturedFrame ? 'Recapturar Frame Atual' : '📸 Capturar Frame Atual'}</span>
          </button>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Pausa o vídeo no segundo ideal e clique para capturar
          </span>
        </div>

        {capturedFrame && (
          <button
            type="button"
            onClick={onRemoveFrame}
            data-testid="btn-remove-captured-frame"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar Frame</span>
          </button>
        )}
      </div>

      {/* Card Informativo do Frame Capturado com Ações Rápidas */}
      {capturedFramePreview && (
        <div
          data-testid="captured-frame-card"
          className="p-3 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-300/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            {/* Miniatura do Frame Capturado */}
            <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-950 border-2 border-amber-400 shrink-0 relative shadow-xs flex items-center justify-center">
              <img
                data-testid="captured-frame-preview-img"
                src={capturedFramePreview}
                alt="Frame capturado"
                className="max-w-full max-h-full object-contain rounded"
              />
              <span className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-[9px] text-amber-300 text-center font-bold py-0.5">
                {formatSeconds(capturedFrameTime)}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-950">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Frame Capturado com Sucesso</span>
                </span>
                <span
                  data-testid="captured-frame-time"
                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold"
                >
                  {formatSeconds(capturedFrameTime)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Você pode escolher este frame nas opções de cada rede social na aba 2, ou aplicar nos campos de capa abaixo:
              </p>
            </div>
          </div>

          {/* Botões Rápidos para Preencher Capas */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={onApplyToVertical}
              data-testid="btn-apply-frame-vertical"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Aplica este frame como Capa Vertical (9:16)"
            >
              <ArrowDownRight className="w-3 h-3 text-[#ea384c]" />
              <span>Capa Vertical (9:16)</span>
            </button>

            <button
              type="button"
              onClick={onApplyToHorizontal}
              data-testid="btn-apply-frame-horizontal"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Aplica este frame como Capa Horizontal (16:9)"
            >
              <ArrowDownRight className="w-3 h-3 text-red-600" />
              <span>Capa 16:9</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
