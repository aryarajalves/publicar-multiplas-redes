import React from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Clock, Loader2 } from 'lucide-react';

interface Props {
  errorMessage: string | null;
  activeMainTab: 'media' | 'social' | 'schedule';
  setActiveMainTab: (tab: 'media' | 'social' | 'schedule') => void;
  onClose: () => void;
  isSubmitting: boolean;
  publishNow: boolean;
}

export const UploadModalFooter: React.FC<Props> = ({
  errorMessage,
  activeMainTab,
  setActiveMainTab,
  onClose,
  isSubmitting,
  publishNow,
}) => {
  return (
    <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
      <div className="w-full sm:w-auto">
        {errorMessage && (
          <div
            data-testid="footer-error-message"
            className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
        {/* Botão Voltar */}
        {activeMainTab !== 'media' && (
          <button
            type="button"
            onClick={() => {
              if (activeMainTab === 'schedule') setActiveMainTab('social');
              else if (activeMainTab === 'social') setActiveMainTab('media');
            }}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
        )}

        {/* Botão Próximo */}
        {activeMainTab !== 'schedule' ? (
          <button
            type="button"
            onClick={() => {
              if (activeMainTab === 'media') setActiveMainTab('social');
              else if (activeMainTab === 'social') setActiveMainTab('schedule');
            }}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
          >
            <span>Avançar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}

        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-3.5 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition-colors"
        >
          Cancelar
        </button>

        {/* Botão Enviar / Agendar */}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-schedule-btn"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ea384c] hover:bg-[#d82a3e] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>{publishNow ? 'Publicar Agora' : 'Confirmar Agendamento'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
