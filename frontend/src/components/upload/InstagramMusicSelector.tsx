import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Search,
  Play,
  Pause,
  Check,
  ExternalLink,
  Loader2,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { InstagramAudioItem } from '../../types';
import { InstagramSelectedMusicCard } from './InstagramSelectedMusicCard';

interface InstagramMusicSelectorProps {
  selectedAudio: InstagramAudioItem | null;
  onSelectAudio: (audio: InstagramAudioItem | null) => void;
  audioVolume: number;
  setAudioVolume: (val: number) => void;
  videoVolume: number;
  setVideoVolume: (val: number) => void;
}

type AudioTabType = 'music' | 'original_sound' | 'favorites';

const formatDurationMs = (ms: number): string => {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const InstagramMusicSelector: React.FC<InstagramMusicSelectorProps> = ({
  selectedAudio,
  onSelectAudio,
  audioVolume,
  setAudioVolume,
  videoVolume,
  setVideoVolume,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [audioType, setAudioType] = useState<AudioTabType>('music');
  const [tracks, setTracks] = useState<InstagramAudioItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const loadFavoritesList = async () => {
    if (typeof (api as any)?.getFavoriteInstagramAudio !== 'function') return;
    try {
      const res = await api.getFavoriteInstagramAudio();
      const favItems: InstagramAudioItem[] = res?.items || [];
      setFavoriteIds(new Set(favItems.map((i) => i.audio_id)));
    } catch {}
  };

  const fetchAudioCatalog = async (
    q?: string,
    type: AudioTabType = audioType,
    afterCursor?: string
  ) => {
    if (typeof (api as any)?.searchInstagramAudio !== 'function') return;
    if (afterCursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setPreviewError(null);
    }
    try {
      const res = await api.searchInstagramAudio({
        q: q !== undefined ? q.trim() : searchQuery.trim(),
        audio_type: type,
        after: afterCursor,
      });
      const incoming: InstagramAudioItem[] = res?.items || [];
      if (afterCursor) {
        setTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.audio_id));
          return [...prev, ...incoming.filter((t) => !existingIds.has(t.audio_id))];
        });
      } else {
        setTracks(incoming);
      }
      setNextCursor(res?.next_cursor || null);

      const newFavIds = new Set(favoriteIds);
      incoming.forEach((t) => {
        if (t.is_favorite) newFavIds.add(t.audio_id);
      });
      setFavoriteIds(newFavIds);
    } catch {
      if (!afterCursor) setTracks([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFavoritesList();
  }, []);

  useEffect(() => {
    fetchAudioCatalog(searchQuery, audioType);
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [audioType]);

  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = Math.max(0.01, Math.min(1, audioVolume / 100));
    }
  }, [audioVolume]);

  const handleToggleFavorite = async (track: InstagramAudioItem) => {
    const isFav = favoriteIds.has(track.audio_id) || Boolean(track.is_favorite);
    const nextSet = new Set(favoriteIds);

    if (isFav) {
      nextSet.delete(track.audio_id);
      setFavoriteIds(nextSet);
      setTracks((prev) =>
        audioType === 'favorites'
          ? prev.filter((t) => t.audio_id !== track.audio_id)
          : prev.map((t) => (t.audio_id === track.audio_id ? { ...t, is_favorite: false } : t))
      );
      if (typeof (api as any)?.removeFavoriteInstagramAudio === 'function') {
        try {
          await api.removeFavoriteInstagramAudio(track.audio_id);
        } catch {}
      }
    } else {
      nextSet.add(track.audio_id);
      setFavoriteIds(nextSet);
      setTracks((prev) =>
        prev.map((t) => (t.audio_id === track.audio_id ? { ...t, is_favorite: true } : t))
      );
      if (typeof (api as any)?.addFavoriteInstagramAudio === 'function') {
        try {
          await api.addFavoriteInstagramAudio(track);
        } catch {}
      }
    }
  };

  const buildStreamUrl = (track: InstagramAudioItem): string => {
    const params = new URLSearchParams({
      audio_id: track.audio_id || '',
      title: track.title || '',
      artist: track.display_artist || '',
    });
    if (track.download_url) {
      params.set('url', track.download_url);
    }
    return `/api/instagram/audio/stream?${params.toString()}`;
  };

  const handleTogglePlay = (track: InstagramAudioItem) => {
    setPreviewError(null);
    if (playingId === track.audio_id) {
      audioPlayerRef.current?.pause();
      setPlayingId(null);
      setLoadingAudioId(null);
      return;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    try {
      const player = new Audio(buildStreamUrl(track));
      player.volume = Math.max(0.01, Math.min(1, audioVolume / 100));
      setLoadingAudioId(track.audio_id);
      player.onplaying = () => {
        setLoadingAudioId(null);
        setPlayingId(track.audio_id);
      };
      player.onended = () => {
        setPlayingId(null);
        setLoadingAudioId(null);
      };
      player.onerror = () => {
        setPlayingId(null);
        setLoadingAudioId(null);
        setPreviewError(`Prévia de áudio indisponível para "${track.title}".`);
      };
      audioPlayerRef.current = player;
      setPlayingId(track.audio_id);
      player.play().catch(() => {
        setPlayingId(null);
        setLoadingAudioId(null);
      });
    } catch {
      setPlayingId(null);
      setLoadingAudioId(null);
    }
  };

  const isSelectedPlaying = Boolean(selectedAudio && playingId === selectedAudio.audio_id);
  const isSelectedLoading = Boolean(selectedAudio && loadingAudioId === selectedAudio.audio_id);

  return (
    <div
      data-testid="instagram-music-selector-card"
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5"
    >
      {/* Cabeçalho + Abas (Músicas, Áudios Originais, Favoritas) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-pink-100 text-pink-600 border border-pink-200 shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Música do Instagram Reels (Catálogo Oficial)
              </h5>
              <span
                data-testid="ig-music-count-badge"
                className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-100 text-pink-700"
              >
                {tracks.length} faixas
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Navegue por +180 faixas em alta, busque por nome/link do Instagram ou salve nas suas Favoritas (⭐).
            </p>
          </div>
        </div>

        {/* Abas: Músicas | Áudios Originais | Favoritas */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setAudioType('music')}
            data-testid="btn-audio-type-music"
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              audioType === 'music' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Músicas
          </button>
          <button
            type="button"
            onClick={() => setAudioType('original_sound')}
            data-testid="btn-audio-type-original"
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              audioType === 'original_sound' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Áudios Originais
          </button>
          <button
            type="button"
            onClick={() => setAudioType('favorites')}
            data-testid="btn-audio-type-favorites"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
              audioType === 'favorites'
                ? 'bg-amber-500 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Star className={`w-3 h-3 ${audioType === 'favorites' ? 'fill-white' : 'fill-amber-400 text-amber-500'}`} />
            <span>Favoritas ({favoriteIds.size})</span>
          </button>
        </div>
      </div>

      {previewError && (
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
          <span>{previewError}</span>
          <button type="button" onClick={() => setPreviewError(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {selectedAudio && (
        <InstagramSelectedMusicCard
          selectedAudio={selectedAudio}
          isSelectedPlaying={isSelectedPlaying}
          isSelectedLoading={isSelectedLoading}
          isFavorite={favoriteIds.has(selectedAudio.audio_id) || Boolean(selectedAudio.is_favorite)}
          onTogglePlay={handleTogglePlay}
          onToggleFavorite={handleToggleFavorite}
          onRemove={() => {
            if (isSelectedPlaying) {
              audioPlayerRef.current?.pause();
              setPlayingId(null);
            }
            onSelectAudio(null);
          }}
          audioVolume={audioVolume}
          setAudioVolume={setAudioVolume}
          videoVolume={videoVolume}
          setVideoVolume={setVideoVolume}
          formatDurationMs={formatDurationMs}
        />
      )}

      {/* Barra de Busca ou Link */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                fetchAudioCatalog(searchQuery, audioType);
              }
            }}
            placeholder="Buscar música, artista ou colar link do áudio do Instagram Reels..."
            data-testid="input-search-ig-music"
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchAudioCatalog('', audioType);
            }}
            className="px-2.5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
          >
            Limpar
          </button>
        )}
        <button
          type="button"
          onClick={() => fetchAudioCatalog(searchQuery, audioType)}
          disabled={isLoading}
          data-testid="btn-search-ig-music"
          className="px-3.5 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Buscar</span>
        </button>
      </div>

      {/* Lista de Músicas do Catálogo */}
      <div data-testid="ig-music-results-list" className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
            <span>Carregando catálogo de músicas do Instagram...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-5 text-center text-xs text-slate-500">
            {audioType === 'favorites'
              ? 'Você ainda não salvou nenhuma música nas Favoritas (clique na estrela ⭐ ao lado de qualquer música).'
              : 'Nenhuma música encontrada para esta busca.'}
          </div>
        ) : (
          <>
            {tracks.map((track) => {
              const isSelected = selectedAudio?.audio_id === track.audio_id;
              const isPlaying = playingId === track.audio_id;
              const isTrackLoading = loadingAudioId === track.audio_id;
              const isFav = favoriteIds.has(track.audio_id) || Boolean(track.is_favorite);

              return (
                <div
                  key={track.audio_id}
                  data-testid={`ig-music-item-${track.audio_id}`}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-pink-50 border-pink-400'
                      : 'bg-white border-slate-200 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(track)}
                      data-testid={`btn-preview-audio-${track.audio_id}`}
                      title={isPlaying ? 'Pausar prévia' : 'Ouvir prévia da música'}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isPlaying
                          ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                          : 'bg-pink-50 hover:bg-pink-100 text-pink-600 border-pink-200'
                      }`}
                    >
                      {isTrackLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 translate-x-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{track.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {track.display_artist || 'Artista'} • {formatDurationMs(track.duration_in_ms)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(track)}
                      data-testid={`btn-favorite-audio-${track.audio_id}`}
                      title={isFav ? 'Remover das Favoritas' : 'Salvar nas Favoritas'}
                      className={`p-1.5 rounded-md border transition-colors ${
                        isFav
                          ? 'bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>

                    {track.on_platform_audio_preview_link && (
                      <a
                        href={track.on_platform_audio_preview_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver áudio no Instagram"
                        className="p-1.5 rounded-md text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectAudio(isSelected ? null : track)}
                      data-testid={`btn-select-audio-${track.audio_id}`}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-100 hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{isSelected ? 'Escolhida' : 'Escolher'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {nextCursor && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => fetchAudioCatalog(searchQuery, audioType, nextCursor)}
                  disabled={isLoadingMore}
                  data-testid="btn-load-more-ig-music"
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Carregar mais músicas</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
