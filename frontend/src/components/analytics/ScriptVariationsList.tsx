import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Clock, Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { ScriptVariation } from '../../types';

interface Props {
  scripts: ScriptVariation[];
  isLoading: boolean;
  onGenerate: () => void;
  onCopy: (text: string, label: string) => void;
}

export const ScriptVariationsList: React.FC<Props> = ({
  scripts,
  isLoading,
  onGenerate,
  onCopy
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(scripts.length > 0 ? scripts[0].id : null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (scripts.length > 0 && expandedId === null) {
      setExpandedId(scripts[0].id);
    }
  }, [scripts, expandedId]);

  const handleCopyFullScript = (s: ScriptVariation) => {
    const fullText = `TITULO: ${s.title}\n\nGANCHO (0-3s):\n"${s.hook}"\n\nDESENVOLVIMENTO:\n${s.body.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\nCHAMADA PARA AÇÃO (CTA):\n"${s.cta}"\n\nDURAÇÃO ESTIMADA: ${s.estimated_duration}\nPOR QUE FUNCIONA: ${s.why_it_works}`;
    onCopy(fullText, `Roteiro #${s.id} copiado na íntegra!`);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div
      data-testid="section-script-variations"
      className="bg-white border border-rose-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 bg-gradient-to-br from-white via-rose-50/20 to-white"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-rose-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ea384c] text-white flex items-center justify-center shrink-0 shadow-xs shadow-red-500/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Fórmula Vencedora: 5 Variações de Roteiro</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-[#ea384c] font-bold">
                IA v4.0
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Multiplique o alcance do seu melhor conteúdo gerando 5 novos roteiros com ganchos validados.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          data-testid="btn-generate-5-scripts"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#ea384c] hover:bg-[#d62d40] text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Gerando Roteiros...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{scripts.length > 0 ? 'Regerar 5 Variações' : 'Gerar 5 Roteiros com IA'}</span>
            </>
          )}
        </button>
      </div>

      {scripts.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
          <Lightbulb className="w-7 h-7 text-amber-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-800">
            Nenhum roteiro gerado ainda para este vídeo
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Clique no botão acima para a inteligência artificial analisar a retenção e gerar 5 variações completas de abertura, corpo e CTA.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="scripts-accordion-list">
          {scripts.map((script) => {
            const isExpanded = expandedId === script.id;
            const isCopied = copiedId === script.id;

            return (
              <div
                key={script.id}
                data-testid={`script-variation-card-${script.id}`}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
              >
                {/* Cabeçalho do Card */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : script.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-rose-50 text-[#ea384c] border border-rose-200 flex items-center justify-center text-xs font-bold shrink-0">
                      #{script.id}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {script.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {script.estimated_duration}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                {isExpanded && (
                  <div className="p-4 space-y-3.5 border-t border-slate-100 text-xs">
                    {/* Gancho (Hook) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                        <span>🔥 Gancho de Abertura (0-3s)</span>
                        <button
                          type="button"
                          onClick={() => onCopy(script.hook, `Gancho #${script.id} copiado!`)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar Gancho</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-950 font-medium italic">
                        &ldquo;{script.hook}&rdquo;
                      </div>
                    </div>

                    {/* Desenvolvimento / Pontos Principais */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        📝 Desenvolvimento (3 Pontos Rápidos)
                      </span>
                      <ul className="space-y-1.5 pl-1">
                        {script.body.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2 text-slate-700">
                            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {pIdx + 1}
                            </span>
                            <span className="leading-snug">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Final */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        🎯 Chamada para Ação (CTA)
                      </span>
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium">
                        &ldquo;{script.cta}&rdquo;
                      </div>
                    </div>

                    {/* Por que funciona & Botão Copiar Completo */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-500 italic max-w-sm">
                        💡 <strong>Por que funciona:</strong> {script.why_it_works}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleCopyFullScript(script)}
                        data-testid={`btn-copy-full-script-${script.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Roteiro Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Roteiro Completo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
