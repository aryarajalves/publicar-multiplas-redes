import React from 'react';
import { PlusCircle, RefreshCw, Radio } from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onRefresh: () => void;
  onOpenAccounts?: () => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<Props> = ({ onOpenUpload, onRefresh, onOpenAccounts, isLoading }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-pink-500/20 border border-slate-700/80 bg-slate-950 flex items-center justify-center shrink-0">
            <img
              src="/logo.jpg"
              alt="MultiPost Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              MultiPost
            </h1>
            <p className="text-xs text-slate-400">
              Agendamento & Cross-Posting (Instagram • YouTube • TikTok)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            title="Atualizar listagem"
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenAccounts && (
            <button
              onClick={onOpenAccounts}
              data-testid="btn-open-accounts"
              title="Gerenciar Contas Conectadas"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-pink-400" />
              <span>Contas</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            data-testid="btn-open-upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-sm shadow-md shadow-pink-600/25 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Novo Vídeo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
