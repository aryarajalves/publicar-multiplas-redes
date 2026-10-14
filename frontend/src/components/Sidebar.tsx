import React from 'react';
import { Film, Users, Radio, LogOut, Terminal, Database } from 'lucide-react';

export type MainTab = 'posts' | 'users' | 'logs' | 'backup';


interface SidebarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenAccounts: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAccounts,
  onOpenTerms,
  onOpenPrivacy,
  onOpenLogout,
}) => {
  return (
    <aside
      data-testid="main-sidebar"
      className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-hidden backdrop-blur-xl z-20 select-none"
    >
      {/* Brand Header */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-14 px-4 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-pink-500/25 border border-slate-700/80 bg-slate-950 flex items-center justify-center shrink-0">
            <img
              src="/logo.jpg"
              alt="MultiPost Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent truncate">
                MultiPost
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-pink-500/20 text-pink-300 rounded border border-pink-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">Hub de Distribuição</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-3 space-y-4 overflow-y-auto">
          {/* Categoria 1: OPERAÇÃO */}
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Operação
            </p>

            {/* Publicações */}
            <button
              onClick={() => onSelectTab('posts')}
              data-testid="sidebar-btn-posts"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-transparent text-white border border-pink-500/40 shadow-sm shadow-pink-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'posts'
                    ? 'bg-pink-500/30 text-pink-300'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
              </div>
              <span>Publicações</span>
            </button>

            {/* Contas Sociais */}
            <button
              onClick={onOpenAccounts}
              data-testid="sidebar-btn-accounts"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all border border-transparent cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-slate-800/80 text-pink-400">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <span className="flex-1 text-left">Contas Sociais</span>
            </button>
          </div>

          {/* Categoria 2: SISTEMA */}
          <div className="space-y-1 pt-1 border-t border-slate-800/40">
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Sistema
            </p>

            {/* Gestão de Usuários */}
            <button
              onClick={() => onSelectTab('users')}
              data-testid="sidebar-btn-users"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-transparent text-white border border-pink-500/40 shadow-sm shadow-pink-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'users'
                    ? 'bg-pink-500/30 text-pink-300'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>Gestão de Usuários</span>
            </button>

            {/* Gestão de Logs */}
            <button
              onClick={() => onSelectTab('logs')}
              data-testid="sidebar-btn-logs"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-transparent text-white border border-pink-500/40 shadow-sm shadow-pink-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'logs'
                    ? 'bg-pink-500/30 text-pink-300'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span>Gestão de Logs</span>
            </button>

            {/* Backup Automático */}
            <button
              onClick={() => onSelectTab('backup')}
              data-testid="sidebar-btn-backup"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-transparent text-white border border-pink-500/40 shadow-sm shadow-pink-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'backup'
                    ? 'bg-pink-500/30 text-pink-300'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
              </div>
              <span>Backup Automático</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer / System Info & Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-slate-950/40">
        {/* Card Sistema Conectado */}
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/60">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">Sistema Conectado</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Instagram • YouTube • TikTok
          </p>
        </div>

        {/* Botão de Sair com Ícone */}
        <button
          onClick={onOpenLogout}
          data-testid="sidebar-btn-logout"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Sair da Conta</span>
        </button>

        {/* Links Legais e Versão */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
          <a
            href="/politicaprivacidade"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpenPrivacy?.()}
            data-testid="sidebar-link-privacy"
            className="hover:text-slate-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Privacidade
          </a>
          <span>•</span>
          <a
            href="/termosdeuso"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpenTerms?.()}
            data-testid="sidebar-link-terms"
            className="hover:text-slate-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Termos
          </a>
          <span>•</span>
          <span className="text-slate-400">v1.2</span>
        </div>
      </div>
    </aside>
  );
};
