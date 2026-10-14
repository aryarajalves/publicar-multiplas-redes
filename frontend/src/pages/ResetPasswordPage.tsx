import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';
import { ResetPasswordTokenResponse } from '../types';

interface ResetPasswordPageProps {
  onGoToLogin: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onGoToLogin }) => {
  const [token, setToken] = useState<string>('');
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(true);
  const [tokenInfo, setTokenInfo] = useState<ResetPasswordTokenResponse | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setTokenError('Link de redefinição inválido ou ausente na URL.');
      setIsValidatingToken(false);
      return;
    }
    setToken(tokenParam);
    validateToken(tokenParam);
  }, []);

  const validateToken = async (tok: string) => {
    setIsValidatingToken(true);
    setTokenError(null);
    try {
      const res = await api.validateResetPasswordToken(tok);
      setTokenInfo(res);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Link de redefinição inválido, expirado ou já utilizado.';
      setTokenError(detail);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 12,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_+=\\/\[\]~`]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordCriteria).every(Boolean);
  }, [passwordCriteria]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isPasswordValid) {
      setFormError('A nova senha não atende a todos os critérios de segurança.');
      return;
    }
    if (!passwordsMatch) {
      setFormError('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.confirmResetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Falha ao redefinir senha. O link pode ter expirado.';
      setFormError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="reset-password-page"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 text-slate-800 relative overflow-hidden"
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#ea384c] shadow-2xs mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Redefinir Senha</h1>
            <p className="text-xs text-slate-500 mt-1">
              Crie uma nova credencial segura para acessar sua conta
            </p>
          </div>

          {/* Validação de Token - Loading */}
          {isValidatingToken && (
            <div
              data-testid="reset-token-loading"
              className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs"
            >
              <Loader2 className="w-7 h-7 text-[#ea384c] animate-spin" />
              <span>Validando link de redefinição...</span>
            </div>
          )}

          {/* Validação de Token - Erro */}
          {!isValidatingToken && tokenError && (
            <div data-testid="reset-token-error" className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-800">Link Inválido ou Expirado</p>
                  <p className="mt-1 text-rose-700">{tokenError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onGoToLogin}
                data-testid="btn-error-go-to-login"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                Voltar para o Login
              </button>
            </div>
          )}

          {/* Sucesso após redefinir */}
          {!isValidatingToken && !tokenError && isSuccess && (
            <div data-testid="reset-success-card" className="space-y-5 text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Senha Atualizada com Sucesso!</h3>
                <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto">
                  Sua nova senha foi criptografada e salva com segurança. Você já pode fazer login na plataforma.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoToLogin}
                data-testid="btn-success-go-to-login"
                className="w-full py-2.5 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Acessar Plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Formulário de Redefinição */}
          {!isValidatingToken && !tokenError && !isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {tokenInfo?.email && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ea384c] shrink-0" />
                  <span className="truncate">
                    Conta: <strong>{tokenInfo.email}</strong>
                  </span>
                </div>
              )}

              {formError && (
                <div
                  data-testid="reset-form-error"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campo Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 12 caracteres"
                    data-testid="input-reset-password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="btn-toggle-reset-password"
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requisitos de Senha Argon2id */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-600 mb-1">Requisitos de Segurança:</p>
                {[
                  { ok: passwordCriteria.minLength, label: 'Mínimo de 12 caracteres' },
                  { ok: passwordCriteria.hasLower, label: 'Ao menos 1 letra minúscula' },
                  { ok: passwordCriteria.hasUpper, label: 'Ao menos 1 letra maiúscula' },
                  { ok: passwordCriteria.hasNumber, label: 'Ao menos 1 número' },
                  { ok: passwordCriteria.hasSpecial, label: 'Ao menos 1 caractere especial' },
                ].map((crit, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        crit.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {crit.ok ? '✓' : '•'}
                    </span>
                    <span className={crit.ok ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      {crit.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua nova senha"
                    data-testid="input-reset-confirm-password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="btn-toggle-reset-confirm-password"
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">As senhas não coincidem.</p>
                )}
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
                data-testid="btn-submit-reset-password"
                className="w-full py-2.5 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Nova Senha...</span>
                  </>
                ) : (
                  <>
                    <span>Redefinir Senha</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer pt-2"
              >
                Voltar para o Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
