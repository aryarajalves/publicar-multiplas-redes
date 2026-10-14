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
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              data-testid="publish-now-checkbox"
              className="rounded border-slate-700 text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
            />
            <span>Publicar agora imediatamente</span>
          </label>
          {publishNow && (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disparo imediato ativo
            </span>
          )}
        </div>

        {!publishNow && (
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              Data e Horário do Agendamento:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                data-testid="schedule-date-input"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O robô disparará a publicação automaticamente na data e hora selecionadas.
            </p>
          </div>
        )}
      </div>

      {/* 2. Resumo da Publicação */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" />
          <span>Resumo da Publicação</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Vídeo */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <FileVideo className="w-3 h-3 text-pink-400" /> Arquivo de Vídeo
            </span>
            {file ? (
              <p className="font-medium text-slate-200 truncate" title={file.name}>
                {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            ) : (
              <p className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Nenhum vídeo anexado
              </p>
            )}
          </div>

          {/* Título */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Título Principal</span>
            <p className="font-medium text-slate-200 truncate">
              {effectiveTitle || <span className="text-slate-500">Ainda não informado</span>}
            </p>
          </div>

          {/* Capas */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-indigo-400" /> Capas / Thumbnails
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${verticalThumbnail ? 'bg-pink-950/60 text-pink-300 border border-pink-800/40' : 'bg-slate-900 text-slate-500'}`}>
                Vertical (9:16): {verticalThumbnail ? '✓ Anexada' : 'Padrão'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${horizontalThumbnail ? 'bg-red-950/60 text-red-300 border border-red-800/40' : 'bg-slate-900 text-slate-500'}`}>
                YouTube: {horizontalThumbnail ? '✓ Anexada' : 'Padrão'}
              </span>
            </div>
          </div>

          {/* Redes */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Redes Destino</span>
            <div className="flex items-center gap-2">
              {platforms.includes('youtube') && (
                <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                  <Youtube className="w-2.5 h-2.5" /> YouTube ({youtubeVideoType})
                </span>
              )}
              {platforms.includes('instagram') && (
                <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-800/40">
                  <Instagram className="w-2.5 h-2.5" /> Reels
                </span>
              )}
              {platforms.includes('tiktok') && (
                <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
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
