import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Link, Copy, Check, Clock, Shield, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Invitation } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteGenerated?: (invitation: Invitation) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onInviteGenerated,
}) => {
  const [role, setRole] = useState<'editor' | 'admin'>('editor');
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedInvitation, setGeneratedInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const invite = await api.createInvitation({
        role,
        expires_in_hours: expiresInHours,
      });
      setGeneratedInvitation(invite);
      if (onInviteGenerated) {
        onInviteGenerated(invite);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Falha ao gerar link de convite.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInvitation?.invite_url) return;
    navigator.clipboard.writeText(generatedInvitation.invite_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setGeneratedInvitation(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const modalContent = (
    <div
      data-testid="invite-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        data-testid="invite-modal-dialog"
        className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[#ea384c]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Gerar Link de Convite
              </h2>
              <p className="text-[11px] text-slate-500">
                Convide um novo membro para criar a própria conta
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            data-testid="btn-close-invite-modal"
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!generatedInvitation ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Seleção de Perfil */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Tipo de Acesso (Cargo)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('editor')}
                    data-testid="role-editor-option"
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'editor'
                        ? 'bg-rose-50 border-rose-400 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Usuário</span>
                      {role === 'editor' && <Check className="w-4 h-4 text-[#ea384c]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Pode criar, editar e agendar publicações em redes sociais.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    data-testid="role-admin-option"
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'admin'
                        ? 'bg-indigo-50 border-indigo-400 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Administrador</span>
                      {role === 'admin' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Acesso ampliado à gestão e geração de convites da equipe.
                    </p>
                  </button>
                </div>
                <p className="text-[10px] text-amber-700 mt-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 shrink-0" />
                  <span>O perfil <strong>Super Admin</strong> é único do sistema e não pode ser criado via convite.</span>
                </p>
              </div>

              {/* Tempo de Expiração */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prazo de Expiração do Convite</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 1, label: '1 hora' },
                    { value: 24, label: '24 horas', badge: 'Padrão' },
                    { value: 72, label: '3 dias' },
                    { value: 168, label: '7 dias' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setExpiresInHours(item.value)}
                      data-testid={`expire-${item.value}h-option`}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        expiresInHours === item.value
                          ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      {item.badge && (
                        <div className="text-[9px] text-[#ea384c] font-semibold uppercase tracking-wider mt-0.5">
                          {item.badge}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  data-testid="btn-generate-invite"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-medium text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Gerar Link de Convite</span>
                </button>
              </div>
            </form>
          ) : (
            /* Link Gerado com Sucesso */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Link de convite exclusivo gerado com sucesso!</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#ea384c]" />
                  <span>Link de Acesso para Cadastro</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInvitation.invite_url || ''}
                    data-testid="invite-link-input"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    data-testid="btn-copy-invite-link"
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#ea384c] hover:bg-[#d82a3e] text-white shadow-xs'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>
                  • <strong>Cargo:</strong>{' '}
                  <span className="text-slate-900 capitalize font-medium">
                    {generatedInvitation.role === 'admin' ? 'Administrador' : 'Usuário (Editor)'}
                  </span>
                </p>
                <p>
                  • <strong>Expira em:</strong>{' '}
                  <span className="text-slate-700 font-mono">
                    {new Date(generatedInvitation.expires_at).toLocaleString('pt-BR')}
                  </span>
                </p>
                <p>
                  • O novo membro cadastrará: <strong>Nome, E-mail, WhatsApp e Senha de 12+ caracteres</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  data-testid="btn-finish-invite"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
