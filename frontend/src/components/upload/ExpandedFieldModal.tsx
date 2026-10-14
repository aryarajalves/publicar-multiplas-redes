import React from 'react';
import { Minimize2 } from 'lucide-react';

interface ExpandedFieldModalProps {
  expandedField: {
    title: string;
    subtitle?: string;
    value: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    testId?: string;
  } | null;
  onClose: () => void;
  onUpdateValue: (val: string) => void;
}

export const ExpandedFieldModal: React.FC<ExpandedFieldModalProps> = ({
  expandedField,
  onClose,
  onUpdateValue,
}) => {
  if (!expandedField) return null;

  return (
    <div
      data-testid="expanded-field-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{expandedField.title}</span>
            </h3>
            {expandedField.subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{expandedField.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-expanded-modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar modo tela cheia"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          <textarea
            value={expandedField.value}
            onChange={(e) => onUpdateValue(e.target.value)}
            readOnly={expandedField.readOnly}
            data-testid={expandedField.testId || 'expanded-field-textarea'}
            placeholder="Digite seu texto com todo o espaço que precisar..."
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors resize-none leading-relaxed font-normal"
          />
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 text-xs">
          <span className="text-slate-400 font-mono">
            {expandedField.value.length} caracteres
          </span>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-expanded-confirm"
            className="px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium transition-colors"
          >
            Concluir e Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
