import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import {
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
  Video,
  Youtube,
  Instagram,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountsState {
  tiktok: { connected: boolean; account_name?: string | null; avatar_url?: string | null; expires_at?: string | null };
  youtube: { connected: boolean; account_name?: string | null };
  instagram: { connected: boolean; account_name?: string | null };
}

export const ConnectedAccountsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [accounts, setAccounts] = useState<AccountsState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trava scroll da tela quando o popup estiver aberto
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getConnectedAccounts();
      setAccounts(data);
    } catch (err: any) {
      console.error('Erro ao carregar contas conectadas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    } else {
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
        popupTimerRef.current = null;
      }
      setIsConnecting(false);
    }
  }, [isOpen, loadAccounts]);

  // Listener para capturar o retorno do popup OAuth do TikTok e limpeza do timer
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        if (popupTimerRef.current) {
          clearInterval(popupTimerRef.current);
          popupTimerRef.current = null;
        }
        setIsConnecting(false);
        setFeedbackMessage({ text: 'Conta do TikTok conectada com sucesso!', type: 'success' });
        loadAccounts();
      } else if (event.data?.type === 'TIKTOK_AUTH_ERROR') {
        if (popupTimerRef.current) {
          clearInterval(popupTimerRef.current);
          popupTimerRef.current = null;
        }
        setIsConnecting(false);
        setFeedbackMessage({ text: event.data?.message || 'Falha na conexão com o TikTok.', type: 'error' });
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => {
      window.removeEventListener('message', handleAuthMessage);
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
        popupTimerRef.current = null;
      }
    };
  }, [loadAccounts]);

  if (!isOpen) return null;

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    setFeedbackMessage(null);
    try {
      const { url } = await api.getTikTokLoginUrl();
      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'TikTokOAuthWindow',
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        setIsConnecting(false);
        setFeedbackMessage({
          text: 'O navegador bloqueou a abertura da janela. Por favor, permita popups para este site.',
          type: 'error',
        });
        return;
      }

      // Limpa qualquer timer anterior caso já estivesse rodando
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
      }

      // Monitora o fechamento manual do popup pelo usuário a cada 500ms
      popupTimerRef.current = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            if (popupTimerRef.current) {
              clearInterval(popupTimerRef.current);
              popupTimerRef.current = null;
            }
            setIsConnecting(false);
            loadAccounts();
          }
        } catch (e) {
          // Erro de cross-origin ou fechamento abrupto
        }
      }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Não foi possível iniciar conexão com o TikTok.';
      setFeedbackMessage({ text: msg, type: 'error' });
      setIsConnecting(false);
    }
  };

  const handleDisconnectTikTok = async () => {
    setIsDisconnecting(true);
    setFeedbackMessage(null);
    try {
      await api.disconnectTikTok();
      setFeedbackMessage({ text: 'Conta do TikTok desconectada com sucesso.', type: 'success' });
      await loadAccounts();
    } catch (err: any) {
      setFeedbackMessage({ text: 'Erro ao desconectar conta do TikTok.', type: 'error' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div
      data-testid="connected-accounts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Contas & Integrações</h2>
              <p className="text-xs text-slate-400">Gerencie a conexão das suas redes sociais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAccounts}
              disabled={isLoading}
              title="Atualizar contas"
              data-testid="btn-refresh-accounts"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              data-testid="btn-close-accounts-modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-3 mx-5 mt-4 rounded-lg text-xs font-medium flex items-center gap-2 border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-red-950/40 border-red-800/50 text-red-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Lista de Contas */}
        <div className="p-5 space-y-3.5">
          {/* Card TikTok */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black border border-slate-800 flex items-center justify-center text-cyan-400 font-bold">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">TikTok</h3>
                  {accounts?.tiktok.connected ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Conectado
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                      Desconectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {accounts?.tiktok.connected
                    ? accounts.tiktok.account_name || 'Conta autorizada'
                    : 'Permissão Content Posting API'}
                </p>
              </div>
            </div>

            <div>
              {accounts?.tiktok.connected ? (
                <button
                  onClick={handleDisconnectTikTok}
                  disabled={isDisconnecting}
                  data-testid="btn-disconnect-tiktok"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-medium border border-red-800/40 transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectTikTok}
                  disabled={isConnecting}
                  data-testid="btn-connect-tiktok"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-pink-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  <span>Conectar TikTok</span>
                </button>
              )}
            </div>
          </div>

          {/* Card YouTube */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">YouTube</h3>
                  {accounts?.youtube.connected ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {accounts?.youtube.connected ? 'YouTube Data API v3 Configurada' : 'Credenciais Google OAuth no .env'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Instagram */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500/10 via-pink-500/10 to-purple-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Instagram Reels</h3>
                  {accounts?.instagram.connected ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {accounts?.instagram.connected ? 'Meta Graph API Configurada' : 'Instagram Token no .env'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com 1 único botão de fechar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Conexões protegidas via OAuth 2.0
          </span>
          <button
            onClick={onClose}
            data-testid="btn-close-modal-footer"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
