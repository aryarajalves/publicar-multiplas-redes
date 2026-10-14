import React from 'react';
import { Film, Users, Radio, LogOut, Terminal, Database, Play } from 'lucide-react';

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
      className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-hidden z-20 select-none shadow-xs"
    >
      {/* Brand Header */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-16 px-4 border-b border-slate-200 flex items-center gap-3 shrink-0 bg-white">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20 shrink-0">
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 truncate">
                MultiPost
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-red-50 text-red-600 rounded border border-red-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">Hub de Distribuição</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4 space-y-5 overflow-y-auto">
          {/* Categoria 1: OPERAÇÃO / GERAL */}
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Operação
            </p>

            {/* Publicações */}
            <button
              onClick={() => onSelectTab('posts')}
              data-testid="sidebar-btn-posts"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'posts'
                    ? 'bg-sky-100 text-sky-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Film className="w-4 h-4" />
              </div>
              <span>Publicações</span>
            </button>

            {/* Contas Sociais */}
            <button
              onClick={onOpenAccounts}
              data-testid="sidebar-btn-accounts"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all border border-transparent cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                <Radio className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left">Contas Sociais</span>
            </button>
          </div>

          {/* Categoria 2: SISTEMA */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Sistema
            </p>

            {/* Gestão de Usuários */}
            <button
              onClick={() => onSelectTab('users')}
              data-testid="sidebar-btn-users"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'users'
                    ? 'bg-sky-100 text-sky-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <span>Gestão de Usuários</span>
            </button>

            {/* Gestão de Logs */}
            <button
              onClick={() => onSelectTab('logs')}
              data-testid="sidebar-btn-logs"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'logs'
                    ? 'bg-sky-100 text-sky-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Terminal className="w-4 h-4" />
              </div>
              <span>Gestão de Logs</span>
            </button>

            {/* Backup Automático */}
            <button
              onClick={() => onSelectTab('backup')}
              data-testid="sidebar-btn-backup"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === 'backup'
                    ? 'bg-sky-100 text-sky-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Database className="w-4 h-4" />
              </div>
              <span>Backup Automático</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer / System Info & Logout */}
      <div className="p-3 border-t border-slate-200 space-y-2 shrink-0 bg-slate-50/60">
        {/* Card Sistema Conectado */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700">Sistema Conectado</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Instagram • YouTube • TikTok
          </p>
        </div>

        {/* Botão de Sair com Ícone */}
        <button
          onClick={onOpenLogout}
          data-testid="sidebar-btn-logout"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 bg-white border border-rose-200 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
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
            className="hover:text-slate-600 transition-colors underline-offset-2 hover:underline cursor-pointer"
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
            className="hover:text-slate-600 transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Termos
          </a>
          <span>•</span>
          <span className="text-slate-400 font-medium">v1.2</span>
        </div>
      </div>
    </aside>
  );
};
