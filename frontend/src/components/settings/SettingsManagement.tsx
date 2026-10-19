import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PublicationSetting, LocationSearchResult } from '../../types';
import { 
  Sliders, 
  MapPin, 
  Instagram, 
  Video, 
  Youtube, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Info,
  Search,
  Save,
  X
} from 'lucide-react';

export const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<PublicationSetting>({
    default_location_name: '',
    default_location_id: '',
    tiktok_location_hashtags: '',
    youtube_location_name: '',
    apply_location_to_all: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Carrega configurações iniciais
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data = await api.getPublicationSettings();
        if (isMounted && data) {
          setSettings(data);
          setSearchQuery(data.default_location_name || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar configurações:', err);
        setFeedback({ text: 'Não foi possível carregar as configurações de publicação.', type: 'error' });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Limpa feedback após 5 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Busca rápida de cidades/localidades com sugestão automática de Place ID e Hashtags
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchLocations(searchQuery.trim());
        setSearchResults(res.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Erro ao buscar cidades:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setSettings((prev) => ({
      ...prev,
      default_location_name: loc.name,
      default_location_id: loc.place_id || prev.default_location_id,
      tiktok_location_hashtags: loc.hashtags || prev.tiktok_location_hashtags,
      youtube_location_name: loc.name || prev.youtube_location_name,
    }));
    setSearchQuery(loc.name);
    setShowDropdown(false);
    setFeedback({ text: `Localização '${loc.city || loc.name}' selecionada!`, type: 'success' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await api.updatePublicationSettings(settings);
      setSettings(updated);
      setFeedback({ text: 'Configurações salvas com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      const msg = err.response?.data?.detail || 'Erro ao salvar as configurações. Tente novamente.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Carregando configurações do sistema...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8" data-testid="settings-management-page">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner de Feedback */}
        {feedback && (
          <div
            data-testid="settings-feedback-banner"
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="text-xs font-semibold">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header da Página */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Configurações de Publicação
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Automático
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina sua localização padrão para marcar vídeos no Instagram e impulsionar no TikTok e YouTube.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="btn-save-settings-top"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>

        {/* Card Principal: Localização Padrão */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Localização Padrão de Disparo</h2>
                <p className="text-xs text-slate-500">
                  Preenchimento automático em todos os vídeos para você não precisar digitar a cada post.
                </p>
              </div>
            </div>

            {/* Toggle Ativar para todas as postagens */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.apply_location_to_all}
                onChange={(e) => setSettings({ ...settings, apply_location_to_all: e.target.checked })}
                data-testid="toggle-apply-location"
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Aplicar automaticamente</span>
            </label>
          </div>

          {/* Campo de Busca de Cidade / Localidade */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sua Cidade / Região Principal
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSettings({ ...settings, default_location_name: e.target.value });
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder="Ex: São Paulo, SP, Brasil ou Curitiba, PR..."
                data-testid="input-location-search"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-sky-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Dropdown de Sugestões de Cidades */}
            {showDropdown && searchResults.length > 0 && (
              <div 
                className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                data-testid="location-dropdown"
              >
                {searchResults.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    data-testid={`location-option-${idx}`}
                    className="w-full px-4 py-2.5 text-left text-xs hover:bg-sky-50 flex items-center justify-between transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{loc.name}</span>
                    </div>
                    {loc.place_id && (
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Place ID Disponível
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid de Configurações Específicas por Rede Social */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Card Instagram */}
            <div className="p-4 rounded-xl border border-pink-100 bg-pink-50/30 space-y-3">
              <div className="flex items-center gap-2 text-pink-700">
                <Instagram className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Instagram Reels</h3>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Place ID (Meta Graph API)
                </label>
                <input
                  type="text"
                  value={settings.default_location_id || ''}
                  onChange={(e) => setSettings({ ...settings, default_location_id: e.target.value })}
                  placeholder="Ex: 111524315534407"
                  data-testid="input-instagram-place-id"
                  className="w-full bg-white border border-pink-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Etiqueta oficial de localização exibida no topo do Reel. Preenchida automaticamente pela cidade.
              </p>
            </div>

            {/* Card TikTok */}
            <div className="p-4 rounded-xl border border-cyan-100 bg-cyan-50/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-800">
                <Video className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">TikTok</h3>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hashtags Regionais Automáticas
                </label>
                <input
                  type="text"
                  value={settings.tiktok_location_hashtags || ''}
                  onChange={(e) => setSettings({ ...settings, tiktok_location_hashtags: e.target.value })}
                  placeholder="Ex: #SaoPaulo #SP #Brasil"
                  data-testid="input-tiktok-hashtags"
                  className="w-full bg-white border border-cyan-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                O TikTok prioriza o algoritmo regional da página "Para Você" através de tags geográficas.
              </p>
            </div>

            {/* Card YouTube */}
            <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <Youtube className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">YouTube</h3>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Localização da Gravação
                </label>
                <input
                  type="text"
                  value={settings.youtube_location_name || ''}
                  onChange={(e) => setSettings({ ...settings, youtube_location_name: e.target.value })}
                  placeholder="Ex: São Paulo, Brasil"
                  data-testid="input-youtube-location"
                  className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Gravada nos detalhes oficiais de gravação do vídeo no YouTube Studio.
              </p>
            </div>
          </div>

          {/* Dica / Informação de Boas Práticas */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Como funciona na prática:</strong> Ao criar ou agendar um novo vídeo, o sistema injetará automaticamente a sua cidade no Instagram, as hashtags de entrega local no TikTok e a localização no YouTube, sem que você precise digitar isso a cada postagem!
            </p>
          </div>

          {/* Botão de Envio do Formulário */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              data-testid="btn-save-settings"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando Configurações...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
