import React from 'react';
import {
  Calendar,
  Clock,
  Film,
  Instagram,
  Youtube,
  Video,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
} from 'lucide-react';

interface ScheduleTabProps {
  publishNow: boolean;
  setPublishNow: (val: boolean) => void;
  scheduledAt: string;
  setScheduledAt: (val: string) => void;
  file: File | null;
  verticalThumbnail: File | null;
  horizontalThumbnail: File | null;
  platforms: string[];
  effectiveTitle: string;
  youtubeVideoType: string;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  publishNow,
  setPublishNow,
  scheduledAt,
  setScheduledAt,
  file,
  verticalThumbnail,
  horizontalThumbnail,
  platforms,
  effectiveTitle,
  youtubeVideoType,
}) => {
  return (
    <div className="space-y-5 animate-fade-in" data-testid="schedule-tab-content">
      {/* 1. Opções de Agendamento ou Disparo Imediato */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              data-testid="publish-now-checkbox"
              className="rounded border-slate-300 text-[#ea384c] focus:ring-[#ea384c] w-4 h-4 cursor-pointer"
            />
            <span>Publicar agora imediatamente</span>
          </label>
          {publishNow && (
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disparo imediato ativo
            </span>
          )}
        </div>

        {!publishNow && (
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ea384c]" />
              Data e Horário do Agendamento:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                data-testid="schedule-date-input"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#ea384c] transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O robô disparará a publicação automaticamente na data e hora selecionadas.
            </p>
          </div>
        )}
      </div>

      {/* 2. Resumo da Publicação */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-slate-600" />
          <span>Resumo da Publicação</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Vídeo */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <FileVideo className="w-3 h-3 text-[#ea384c]" /> Arquivo de Vídeo
            </span>
            {file ? (
              <p className="font-semibold text-slate-800 truncate" title={file.name}>
                {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            ) : (
              <p className="text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Nenhum vídeo anexado
              </p>
            )}
          </div>

          {/* Título */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Título Principal</span>
            <p className="font-semibold text-slate-800 truncate">
              {effectiveTitle || <span className="text-slate-400 font-normal">Ainda não informado</span>}
            </p>
          </div>

          {/* Capas */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-sky-600" /> Capas / Thumbnails
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${verticalThumbnail ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-slate-200 text-slate-600'}`}>
                Vertical (9:16): {verticalThumbnail ? '✓ Anexada' : 'Padrão'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${horizontalThumbnail ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-200 text-slate-600'}`}>
                YouTube: {horizontalThumbnail ? '✓ Anexada' : 'Padrão'}
              </span>
            </div>
          </div>

          {/* Redes */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Redes Destino</span>
            <div className="flex items-center gap-2">
              {platforms.includes('youtube') && (
                <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  <Youtube className="w-2.5 h-2.5" /> YouTube ({youtubeVideoType})
                </span>
              )}
              {platforms.includes('instagram') && (
                <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200">
                  <Instagram className="w-2.5 h-2.5" /> Reels
                </span>
              )}
              {platforms.includes('tiktok') && (
                <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                  <Video className="w-2.5 h-2.5" /> TikTok
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
