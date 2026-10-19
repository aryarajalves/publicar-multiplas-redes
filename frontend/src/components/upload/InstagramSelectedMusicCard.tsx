import React from 'react';
import {
  Music,
  Play,
  Pause,
  X,
  Volume2,
  Loader2,
  Star,
} from 'lucide-react';
import { InstagramAudioItem } from '../../types';

interface InstagramSelectedMusicCardProps {
  selectedAudio: InstagramAudioItem;
  isSelectedPlaying: boolean;
  isSelectedLoading: boolean;
  isFavorite: boolean;
  onTogglePlay: (track: InstagramAudioItem) => void;
  onToggleFavorite: (track: InstagramAudioItem) => void;
  onRemove: () => void;
  audioVolume: number;
  setAudioVolume: (val: number) => void;
  videoVolume: number;
  setVideoVolume: (val: number) => void;
  formatDurationMs: (ms: number) => string;
}

export const InstagramSelectedMusicCard: React.FC<InstagramSelectedMusicCardProps> = ({
  selectedAudio,
  isSelectedPlaying,
  isSelectedLoading,
  isFavorite,
  onTogglePlay,
  onToggleFavorite,
  onRemove,
  audioVolume,
  setAudioVolume,
  videoVolume,
  setVideoVolume,
  formatDurationMs,
}) => {
  return (
    <div
      data-testid="selected-ig-music-card"
      className="p-3.5 rounded-xl bg-white border-2 border-pink-400 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onTogglePlay(selectedAudio)}
            data-testid="btn-play-selected-ig-music-cover"
            title={isSelectedPlaying ? 'Pausar música' : 'Ouvir música selecionada'}
            className="relative w-10 h-10 rounded-lg bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-all overflow-hidden group"
          >
            {selectedAudio.cover_artwork_thumbnail_uri && (
              <img
                src={selectedAudio.cover_artwork_thumbnail_uri}
                alt={selectedAudio.title}
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-25 transition-opacity"
              />
            )}
            <span className="relative z-10">
              {isSelectedLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSelectedPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 translate-x-0.5" />
              )}
            </span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-100 text-pink-700 rounded">
                Selecionada
              </span>
              <p className="text-xs font-bold text-slate-900 truncate" data-testid="selected-ig-music-title">
                {selectedAudio.title}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {selectedAudio.display_artist || 'Artista'} • {formatDurationMs(selectedAudio.duration_in_ms)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(selectedAudio)}
            data-testid="btn-favorite-selected-ig-music"
            title={isFavorite ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isFavorite
                ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-amber-600 hover:border-amber-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Favorita' : 'Favoritar'}</span>
          </button>

          <button
            type="button"
            onClick={() => onTogglePlay(selectedAudio)}
            data-testid="btn-play-selected-ig-music"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isSelectedPlaying
                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
            }`}
          >
            {isSelectedLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSelectedPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isSelectedPlaying ? 'Pausar' : 'Ouvir'}</span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            data-testid="btn-remove-ig-music"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remover</span>
          </button>
        </div>
      </div>

      {/* Sliders de Volume (Música vs Vídeo Original) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3 text-pink-600" />
              Volume da Música
            </span>
            <span className="text-pink-700 font-bold" data-testid="label-ig-audio-volume">
              {audioVolume}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={audioVolume}
            onChange={(e) => setAudioVolume(Number(e.target.value))}
            data-testid="slider-ig-audio-volume"
            className="w-full accent-pink-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-slate-600" />
              Volume Original do Vídeo
            </span>
            <span className="text-slate-800 font-bold" data-testid="label-ig-video-volume">
              {videoVolume}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={videoVolume}
            onChange={(e) => setVideoVolume(Number(e.target.value))}
            data-testid="slider-ig-video-volume"
            className="w-full accent-slate-700 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
