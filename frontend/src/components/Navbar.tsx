import React from 'react';
import { PlusCircle, RefreshCw, Radio, Play } from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onRefresh: () => void;
  onOpenAccounts?: () => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<Props> = ({ onOpenUpload, onRefresh, onOpenAccounts, isLoading }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20 shrink-0">
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              MultiPost
            </h1>
            <p className="text-xs text-slate-500">
              Agendamento & Cross-Posting (Instagram • YouTube • TikTok)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            title="Atualizar listagem"
            disabled={isLoading}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenAccounts && (
            <button
              onClick={onOpenAccounts}
              data-testid="btn-open-accounts"
              title="Gerenciar Contas Conectadas"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-red-500" />
              <span>Contas</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            data-testid="btn-open-upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ea384c] hover:bg-[#d82a3e] text-white font-medium text-xs sm:text-sm shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Novo Vídeo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
