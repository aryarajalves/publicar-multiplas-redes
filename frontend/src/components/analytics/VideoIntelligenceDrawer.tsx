import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Copy, 
  Check, 
  Video,
  ZoomIn
} from 'lucide-react';
import { VideoPerformanceItem, ScriptVariation } from '../../types';
import { api } from '../../services/api';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ScriptVariationsList } from './ScriptVariationsList';

interface Props {
  video: VideoPerformanceItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoIntelligenceDrawer: React.FC<Props> = ({ video, isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [scripts, setScripts] = useState<ScriptVariation[]>([]);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState<boolean>(false);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reseta variações de roteiro quando o vídeo selecionado mudar
  useEffect(() => {
    setScripts([]);
  }, [video?.id]);

  // Trava scroll da tela inteira enquanto o popup estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Limpa o timer de toast ao desmontar ou fechar
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || !video) return null;

  const diagnosis = video.ai_diagnosis;
  const thumbUrl = video.thumbnail_path
    ? api.getVideoUrl(video.thumbnail_path)
    : video.youtube_thumbnail_path
    ? api.getVideoUrl(video.youtube_thumbnail_path)
    : null;

  const handleCopyIdea = (text: string, idx: number) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch {}

    setCopiedIndex(idx);
    setToastMessage('Ideia copiada para a área de transferência!');

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      setCopiedIndex(null);
    }, 2800);
  };

  const handleGenerateScripts = async () => {
    if (!video) return;
    setIsGeneratingScripts(true);
    try {
      const res = await api.generateScriptVariations(video.id);
      if (res && res.scripts && res.scripts.length > 0) {
        setScripts(res.scripts);
        setToastMessage('5 novas variações de roteiro geradas com sucesso!');
      } else {
        setToastMessage('Não foi possível gerar os roteiros. Tente novamente.');
      }
    } catch {
      setToastMessage('Erro ao comunicar com a IA. Tente novamente.');
    } finally {
      setIsGeneratingScripts(false);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none"
      data-testid="video-intelligence-drawer-backdrop"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toast no Canto Superior Direito */}
      {toastMessage && (
        <div
          data-testid="toast-copy-success"
          className="fixed top-5 right-5 z-[10001] flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="text-xs pr-1">
            <p className="font-semibold text-white leading-tight">Copiado com sucesso!</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            data-testid="btn-close-toast"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        data-testid="video-intelligence-drawer"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ea384c] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ea384c] uppercase tracking-wider">
                  Raio-X de Inteligência & Diagnóstico
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  IA v4.0
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                {video.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-intelligence-drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Card Resumo do Vídeo e Métricas Rápidas */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div
              onClick={() => thumbUrl && setFullscreenImage(thumbUrl)}
              data-testid="drawer-video-thumbnail"
              title={thumbUrl ? "Clique para ver a capa em tela cheia" : undefined}
              className={`w-24 sm:w-32 h-28 sm:h-36 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-300 relative group flex items-center justify-center p-1 ${
                thumbUrl ? 'cursor-pointer hover:border-[#ea384c] transition-all shadow-xs' : ''
              }`}
            >
              {thumbUrl ? (
                <>
                  <img
                    src={thumbUrl}
                    alt={video.title}
                    className="max-w-full max-h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 rounded-xl">
                    <ZoomIn className="w-4 h-4 text-amber-300" />
                    <span className="text-[10px] font-bold">Tela Cheia</span>
                  </div>
                </>
              ) : (
                <Video className="w-6 h-6 text-slate-600" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 leading-snug">
                {video.title}
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Views</span>
                  <span className="text-sm font-bold text-slate-900">{video.total_views.toLocaleString('pt-BR')}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Likes</span>
                  <span className="text-sm font-bold text-rose-600">{video.total_likes.toLocaleString('pt-BR')}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Engajamento</span>
                  <span className="text-sm font-bold text-emerald-600">{video.engagement_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {diagnosis ? (
            <>
              {/* Seção 1: Análise do Gancho (Hook) */}
              <div
                data-testid="section-hook-analysis"
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Análise do Gancho (Primeiros 5 Segundos)
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    <span>Nota do Gancho:</span>
                    <span className="text-[#ea384c]">{diagnosis.hook_score}/10</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs italic text-slate-700 flex items-start justify-between gap-3">
                  <span className="flex-1">&ldquo;{diagnosis.hook_text}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => handleCopyIdea(diagnosis.hook_text, -1)}
                    title="Copiar texto do gancho"
                    data-testid="btn-copy-hook"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">Veredito da IA:</strong> {diagnosis.hook_verdict}
                </p>
              </div>

              {/* Seção 2: Por que Performou ou O que Faltou */}
              <div
                data-testid="section-why-performed"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Forças / Por que funcionou */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pontos Fortes & Gatilhos</span>
                  </div>
                  <p className="text-xs text-emerald-950/80 leading-relaxed">
                    {diagnosis.why_it_performed}
                  </p>
                </div>

                {/* Fraquezas / O que pode melhorar */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Gargalos Identificados</span>
                  </div>
                  <ul className="text-xs text-amber-950/80 space-y-1 list-disc list-inside">
                    {diagnosis.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Seção 3: O que Fazer Agora? (Próximos Conteúdos Recomendados) */}
              <div
                data-testid="section-next-steps"
                className="bg-white border border-rose-100 rounded-xl p-4 space-y-3 shadow-2xs bg-gradient-to-br from-white via-rose-50/20 to-white"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#ea384c]" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    O Que Gravar Agora? (Ideias de Continuação Prontas)
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {diagnosis.recommended_next_topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3 shadow-2xs hover:border-[#ea384c]/50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-[#ea384c] text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-medium text-slate-800 leading-snug">
                          {topic}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyIdea(topic, idx)}
                        data-testid={`btn-copy-idea-${idx}`}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Ideia</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 4: Fórmula Vencedora - 5 Variações de Roteiro por IA */}
              <ScriptVariationsList
                scripts={scripts}
                isLoading={isGeneratingScripts}
                onGenerate={handleGenerateScripts}
                onCopy={(text, label) => {
                  try {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(text);
                    }
                  } catch {}
                  setToastMessage(label);
                  if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                  toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2800);
                }}
              />
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Diagnóstico de IA em processamento para este vídeo.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar Diagnóstico
          </button>
        </div>
      </div>

      {/* Visualizador de Capa em Tela Cheia */}
      <ImageLightboxModal
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        title={video.title}
        onClose={() => setFullscreenImage(null)}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};
