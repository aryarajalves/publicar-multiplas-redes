import React, { useState, useEffect, useMemo } from 'react';
import { Youtube, Link2, X, CheckCircle2, RefreshCw, Search, Film, Calendar, Clock } from 'lucide-react';
import { api } from '../services/api';
import { YouTubeVideoOption } from '../types';

interface YouTubeEndScreenSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  initialOptions?: YouTubeVideoOption[];
}

export const YouTubeEndScreenSelect: React.FC<YouTubeEndScreenSelectProps> = ({
  value,
  onChange,
  disabled = false,
  initialOptions,
}) => {
  const [options, setOptions] = useState<YouTubeVideoOption[]>(initialOptions || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialOptions !== undefined) {
      setOptions(initialOptions);
      return;
    }
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const data = await api.getYoutubeVideoOptions();
        if (isMounted) {
          setOptions(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar vídeos do YouTube para a tela final:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [initialOptions]);

  // 1. Filtra rigorosamente vídeos longos (excluindo shorts)
  // 2. Ordena do último vídeo publicado (mais recente) no topo para os mais antigos
  const longOptions = useMemo(() => {
    return options
      .filter((opt) => (opt.type || '').toLowerCase() !== 'shorts')
      .sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at || 0).getTime();
        const dateB = new Date(b.published_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
  }, [options]);

  // 3. Filtro em tempo real pela digitação do usuário
  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return longOptions;
    return longOptions.filter((opt) => opt.title.toLowerCase().includes(term));
  }, [longOptions, searchTerm]);

  const selectedOption = useMemo(() => {
    return longOptions.find(
      (opt) => opt.url === value || (opt.youtube_id && value.includes(opt.youtube_id))
    );
  }, [longOptions, value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === '__manual__' || selectedVal === '') {
      onChange('');
      return;
    }
    onChange(selectedVal);
  };

  const handleChooseVideo = (videoUrl: string) => {
    if (value === videoUrl) {
      onChange('');
    } else {
      onChange(videoUrl);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
      data-testid="youtube-end-screen-container"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-600" />
          <span>Vídeo que vai aparecer no final (Tela Final)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium lowercase">
            opcional
          </span>
        </label>
        <span className="text-[10px] text-slate-500 font-medium">Recomendação / Tela Final</span>
      </div>

      {/* 1. Barra de Pesquisa / Filtro em Tempo Real */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-red-600" />
            Filtrar vídeos longos do canal:
          </span>
          <span className="text-slate-400">
            {filteredOptions.length} de {longOptions.length} vídeo(s) longo(s)
          </span>
        </div>

        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            data-testid="youtube-related-video-search"
            value={searchTerm}
            disabled={disabled || loading}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite palavras-chave para filtrar (ex: IA, VTurb, ZapJords)..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
              title="Limpar filtro de busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Dropdown de Seleção (ordenado do último publicado pra cima) */}
      <div className="space-y-1.5">
        <div className="relative">
          <select
            data-testid="youtube-related-video-select"
            aria-label="Selecionar vídeo para tela final"
            disabled={disabled || loading}
            value={selectedOption ? selectedOption.url : ''}
            onChange={handleSelectChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
          >
            <option value="">
              {searchTerm
                ? `-- Selecione entre os vídeos filtrados (${filteredOptions.length}) --`
                : '-- Selecione um vídeo já publicado (do último para cima) --'}
            </option>
            {filteredOptions.map((opt, idx) => (
              <option key={opt.post_id} value={opt.url}>
                🎬 [{opt.duration_formatted || 'Vídeo'}] {opt.title} {idx === 0 && !searchTerm ? '🔥 (Mais recente)' : ''}
              </option>
            ))}
          </select>

          {loading && (
            <div className="absolute right-3 top-3 pointer-events-none">
              <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* 3. Lista Interativa de Resultados Filtrados */}
      {filteredOptions.length > 0 ? (
        <div
          data-testid="youtube-video-cards-list"
          className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar rounded-lg"
        >
          {filteredOptions.map((opt, idx) => {
            const isSelected = selectedOption?.url === opt.url;
            const formattedDate = formatDate(opt.published_at || opt.created_at);

            return (
              <div
                key={opt.post_id}
                data-testid={`youtube-video-option-${opt.youtube_id || opt.post_id}`}
                onClick={() => handleChooseVideo(opt.url)}
                className={`flex items-center gap-3 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Thumbnail ou Ícone */}
                <div className="relative w-14 h-9 shrink-0 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                  {opt.thumbnail ? (
                    <img
                      src={opt.thumbnail}
                      alt={opt.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Film className="w-5 h-5 text-slate-400" />
                  )}
                  {opt.duration_formatted && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] font-mono px-1 rounded text-white leading-tight">
                      {opt.duration_formatted}
                    </span>
                  )}
                </div>

                {/* Info do Vídeo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-medium truncate ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {opt.title}
                    </p>
                    {idx === 0 && !searchTerm && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-50 border border-red-200 text-red-700 font-bold shrink-0">
                        🔥 Mais recente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    {formattedDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                        {formattedDate}
                      </span>
                    )}
                    {opt.duration_formatted && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {opt.duration_formatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicador de Seleção */}
                <div className="shrink-0 pr-1">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selecionado
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-[10px] font-medium text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      Escolher
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 text-center rounded-lg bg-slate-100/60 border border-slate-200 text-xs text-slate-500">
          Nenhum vídeo longo encontrado para o filtro &ldquo;{searchTerm}&rdquo;.
        </div>
      )}

      {/* Card de confirmação do vídeo selecionado */}
      {selectedOption && (
        <div
          data-testid="selected-video-preview"
          className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2 text-xs text-slate-800"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate font-medium text-slate-900">
              {selectedOption.title}
            </span>
            {selectedOption.duration_formatted && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold shrink-0">
                {selectedOption.duration_formatted}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            title="Remover vídeo selecionado"
            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Campo de link / ID manual */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <Link2 className="w-3 h-3 text-slate-400" />
            Link ou ID do vídeo (selecionado ou digitado):
          </span>
          <span className="font-mono text-slate-400">
            {value.length}/500
          </span>
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            maxLength={500}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Cole o link ou ID do vídeo do YouTube (ex: https://www.youtube.com/watch?v=XYZ123)"
            data-testid="youtube-related-video-input"
            disabled={disabled}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors font-mono pr-9"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
              title="Limpar link"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Indique o vídeo longo que o espectador deve assistir em seguida. Este link será promovido como recomendação da tela final na descrição do vídeo publicado no YouTube.
      </p>
    </div>
  );
};
