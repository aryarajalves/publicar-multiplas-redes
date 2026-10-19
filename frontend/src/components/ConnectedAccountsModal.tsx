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
  Copy,
  Check,
  Link2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountsState {
  tiktok: {
    connected: boolean;
    account_name?: string | null;
    avatar_url?: string | null;
    expires_at?: string | null;
    redirect_uri?: string;
    client_key?: string;
  };
  youtube: { connected: boolean; account_name?: string | null };
  instagram: { connected: boolean; account_name?: string | null };
}

export const ConnectedAccountsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [accounts, setAccounts] = useState<AccountsState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
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

  const redirectUri = accounts?.tiktok?.redirect_uri || 'http://localhost:7800/api/auth/tiktok/callback';

  const handleCopyRedirectUri = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(redirectUri);
      }
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2500);
    } catch (e) {
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2500);
    }
  };

  return (
    <div
      data-testid="connected-accounts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 shadow-2xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contas & Integrações</h2>
              <p className="text-xs text-slate-500">Gerencie a conexão das suas redes sociais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAccounts}
              disabled={isLoading}
              title="Atualizar contas"
              data-testid="btn-refresh-accounts"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              data-testid="btn-close-accounts-modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Lista de Contas */}
        <div className="p-5 space-y-3.5">
          {/* Card TikTok */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 font-bold shadow-2xs">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">TikTok</h3>
                  {accounts?.tiktok.connected ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      Desconectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectTikTok}
                  disabled={isConnecting}
                  data-testid="btn-connect-tiktok"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#ea384c] hover:bg-[#d82a3e] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  <span>Conectar TikTok</span>
                </button>
              )}
            </div>
          </div>

          {/* Seção Informativa de Redirect URI do TikTok */}
          <div className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <Link2 className="w-3.5 h-3.5 text-[#ea384c]" />
                <span>Redirect URI (TikTok Developers)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyRedirectUri}
                data-testid="btn-copy-redirect-uri"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ea384c] hover:text-[#d62e41] cursor-pointer"
              >
                {copiedRedirect ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all flex items-center justify-between gap-2 shadow-2xs">
              <span data-testid="text-redirect-uri">{redirectUri}</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cole esta URL no portal <strong>TikTok for Developers</strong> em: <em>Seu App &gt; Login Kit / Content Posting &gt; Redirect URI</em>. Ao subir para produção, atualize <code>TIKTOK_REDIRECT_URI</code> no <code>.env</code> do servidor para a URL pública do seu domínio.
            </p>
          </div>

          {/* Card YouTube */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-2xs">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">YouTube</h3>
                  {accounts?.youtube.connected ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {accounts?.youtube.connected ? 'YouTube Data API v3 Configurada' : 'Credenciais Google OAuth no .env'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Instagram */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shadow-2xs">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Instagram Reels</h3>
                  {accounts?.instagram.connected ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {accounts?.instagram.connected ? 'Meta Graph API Configurada' : 'Instagram Token no .env'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com 1 único botão de fechar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Conexões protegidas via OAuth 2.0
          </span>
          <button
            onClick={onClose}
            data-testid="btn-close-modal-footer"
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
