import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface UserModalProps {
  isOpen: boolean;
  userToEdit: User | null;
  onClose: () => void;
  onSuccess: (savedUser: User) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  userToEdit,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [generatedResetUrl, setGeneratedResetUrl] = useState<string | null>(null);
  const [copiedResetUrl, setCopiedResetUrl] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setPassword('');
      setRole(userToEdit.role);
      setIsActive(userToEdit.is_active);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('editor');
      setIsActive(true);
    }
    setError(null);
    setShowPassword(false);
    setResetSuccessMsg(null);
    setGeneratedResetUrl(null);
    setCopiedResetUrl(false);
  }, [userToEdit, isOpen]);

  const handleSendResetLink = async () => {
    if (!userToEdit) return;
    setIsSendingReset(true);
    setError(null);
    setResetSuccessMsg(null);
    try {
      const res = await api.sendUserPasswordReset(userToEdit.id);
      setResetSuccessMsg(res.message);
      setGeneratedResetUrl(res.reset_url);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Falha ao enviar link de redefinição.';
      setError(msg);
    } finally {
      setIsSendingReset(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe o nome do usuário.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (!userToEdit && (!password || password.length < 6)) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      if (userToEdit) {
        const payload: any = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          is_active: isActive,
        };
        if (password) {
          payload.password = password;
        }
        const updated = await api.updateUser(userToEdit.id, payload);
        onSuccess(updated);
      } else {
        const created = await api.createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          is_active: isActive,
        });
        onSuccess(created);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Falha ao salvar usuário.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      data-testid="user-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        data-testid="user-modal-dialog"
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {userToEdit ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <p className="text-xs text-slate-400">
                {userToEdit
                  ? 'Atualize as credenciais e permissões do usuário'
                  : 'Cadastre um novo operador com acesso ao MultiPost'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            data-testid="user-modal-close"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nome Completo
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Maria Silva"
                data-testid="input-user-name"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@multipost.com"
                data-testid="input-user-email"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {userToEdit ? 'Nova Senha (deixe vazio para manter a atual)' : 'Senha de Acesso'}
              </label>
              {userToEdit && (
                <button
                  type="button"
                  onClick={handleSendResetLink}
                  disabled={isSendingReset}
                  data-testid="btn-modal-send-reset-password"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-400 hover:text-pink-300 disabled:opacity-50 transition-colors"
                >
                  {isSendingReset ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <KeyRound className="w-3 h-3" />
                  )}
                  <span>Enviar link de redefinição</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={userToEdit ? '••••••••' : 'Mínimo de 6 caracteres'}
                data-testid="input-user-password"
                minLength={userToEdit ? 0 : 6}
                required={!userToEdit}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="btn-toggle-password-visibility"
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {resetSuccessMsg && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex flex-col gap-1.5" data-testid="msg-reset-password-sent">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{resetSuccessMsg}</span>
                </div>
                {generatedResetUrl && (
                  <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-1.5 rounded border border-emerald-500/30 text-[11px] text-slate-300">
                    <span className="truncate max-w-[280px] font-mono">{generatedResetUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedResetUrl);
                        setCopiedResetUrl(true);
                        setTimeout(() => setCopiedResetUrl(false), 2000);
                      }}
                      className="shrink-0 p-1 hover:text-white text-emerald-400"
                      title="Copiar link"
                    >
                      {copiedResetUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Perfil / Função */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Função do Usuário
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('editor')}
                data-testid="btn-role-editor"
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  role === 'editor'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-indigo-300">Editor</span>
                  {role === 'editor' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Cria, edita e agenda postagens
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                data-testid="btn-role-admin"
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  role === 'admin'
                    ? 'border-pink-500 bg-pink-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-pink-300">Administrador</span>
                  {role === 'admin' && <Shield className="w-3.5 h-3.5 text-pink-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Acesso total a usuários e configurações
                </p>
              </button>
            </div>
          </div>

          {/* Status Ativo Toggle */}
          <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <p className="text-xs font-medium text-slate-200">Acesso Habilitado</p>
              <p className="text-[11px] text-slate-400">
                Se inativo, o usuário não poderá autenticar no sistema.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              data-testid="switch-is-active"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isActive ? 'bg-pink-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              data-testid="btn-cancel-user-modal"
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              data-testid="btn-submit-user"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-pink-600/20 transition-all disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{userToEdit ? 'Salvar Alterações' : 'Criar Usuário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

