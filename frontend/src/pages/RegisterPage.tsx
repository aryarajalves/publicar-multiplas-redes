import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { InvitationValidateResponse } from '../types';
import { RegisterOtpStep } from '../components/RegisterOtpStep';
import { PhoneDdiInput } from '../components/PhoneDdiInput';

interface RegisterPageProps {
  onGoToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin }) => {
  const [token, setToken] = useState<string>('');
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(true);
  const [tokenValidation, setTokenValidation] = useState<InvitationValidateResponse | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Etapa atual: 'form' (Painel 1) ou 'verify' (Painel 2 - OTP)
  const [step, setStep] = useState<'form' | 'verify'>('form');

  // Campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Código de verificação OTP
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Estados de submissão e feedback
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);

  // Extrai token da URL na montagem
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setTokenError('Link de convite inválido ou ausente na URL.');
      setIsValidatingToken(false);
      return;
    }
    setToken(tokenParam);
    validateToken(tokenParam);
  }, []);

  // Timer regressivo para reenvio de código
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const validateToken = async (tok: string) => {
    setIsValidatingToken(true);
    setTokenError(null);
    try {
      const res = await api.validateInvitation(tok);
      setTokenValidation(res);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Link de convite inválido, expirado ou já utilizado.';
      setTokenError(detail);
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Requisitos rígidos de senha
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 12,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_+=\\/\[\]~`]/.test(password),
    };
  }, [password]);

  const allCriteriaMet = useMemo(() => {
    return (
      passwordCriteria.minLength &&
      passwordCriteria.hasUpper &&
      passwordCriteria.hasLower &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSpecial
    );
  }, [passwordCriteria]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const isStep1Valid = Boolean(
    name.trim() &&
    email.trim() &&
    email.includes('@') &&
    whatsapp.trim() &&
    allCriteriaMet &&
    passwordsMatch
  );

  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCodeSuccessMsg(null);

    if (!name.trim()) {
      setFormError('Por favor, informe seu nome completo.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (!whatsapp.trim() || whatsapp.replace(/\D/g, '').length < 8) {
      setFormError('Por favor, informe um número de WhatsApp com DDD válido.');
      return;
    }
    if (!allCriteriaMet) {
      setFormError('Sua senha precisa atender a todos os 5 requisitos de segurança listados abaixo.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await api.sendVerificationCode(token, cleanEmail);
      setCodeSuccessMsg(res.message || 'Código enviado com sucesso!');
      setCountdown(60);
      setStep('verify');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao enviar código de verificação.';
      setFormError(detail);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    setFormError(null);
    setCodeSuccessMsg(null);
    setIsSendingCode(true);
    try {
      const res = await api.sendVerificationCode(token, email.trim().toLowerCase());
      setCodeSuccessMsg(res.message || 'Novo código enviado com sucesso!');
      setCountdown(60);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao reenviar código.';
      setFormError(detail);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setFormError('Por favor, digite o código de 6 dígitos recebido por e-mail.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.registerByInvite(token, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        password,
        verification_code: verificationCode.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Falha ao validar código. Tente novamente.';
      setFormError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="register-page-view"
      className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-[#ea384c] selection:text-white"
    >
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-3 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#ea384c]" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Multi<span className="text-[#ea384c]">Post</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma Unificada de Publicação e Agendamento
          </p>
        </div>

        {isValidatingToken && (
          <div data-testid="validating-token-state" className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#ea384c] animate-spin mx-auto" />
            <p className="text-xs text-slate-600 font-medium">Validando seu link de convite...</p>
          </div>
        )}

        {!isValidatingToken && tokenError && (
          <div data-testid="token-error-state" className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Convite Não Disponível</h2>
              <p className="text-xs text-slate-500 leading-relaxed">{tokenError}</p>
            </div>
            <button
              onClick={onGoToLogin}
              data-testid="btn-error-go-to-login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <span>Ir para Tela de Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isValidatingToken && !tokenError && isSuccess && (
          <div data-testid="register-success-state" className="py-4 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Conta Criada com Sucesso!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seu e-mail foi validado e sua conta ativada com criptografia Argon2id. Acesse a plataforma com suas credenciais.
              </p>
            </div>
            <button
              onClick={onGoToLogin}
              data-testid="btn-success-go-to-login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>Acessar Painel Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isValidatingToken && !tokenError && !isSuccess && step === 'verify' && (
          <RegisterOtpStep
            email={email}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            isSubmitting={isSubmitting}
            isResending={isSendingCode}
            countdown={countdown}
            formError={formError}
            codeSuccessMsg={codeSuccessMsg}
            onConfirm={handleFinalSubmit}
            onResend={handleResendCode}
            onBack={() => {
              setStep('form');
              setFormError(null);
            }}
          />
        )}

        {!isValidatingToken && !tokenError && !isSuccess && step === 'form' && (
          <form onSubmit={handleProceedToVerification} autoComplete="off" className="space-y-4">
            <input type="text" name="fake_un_multipost" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} autoComplete="off" />
            <input type="password" name="fake_pw_multipost" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} autoComplete="off" />

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Tipo de acesso:</span>
              <span className="font-bold text-[#ea384c] capitalize">
                {tokenValidation?.role === 'admin' ? 'Administrador' : 'Usuário (Editor)'}
              </span>
            </div>

            {tokenValidation?.email_service_configured === false && (
              <div
                data-testid="brevo-not-configured-warning"
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  O serviço Brevo não está conectado (chave BREVO_API_KEY não configurada no .env). O código OTP não poderá ser disparado.
                </span>
              </div>
            )}

            {formError && (
              <div
                data-testid="register-form-error"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  data-testid="input-register-name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* E-mail Profissional */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  data-testid="input-register-email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* WhatsApp com DDI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp</label>
              <PhoneDdiInput
                value={whatsapp}
                onChange={(val) => setWhatsapp(val)}
                inputTestId="input-register-whatsapp"
                dropdownTestId="dropdown-ddi-trigger"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha forte"
                  data-testid="input-register-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  data-testid="input-register-confirm-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">As senhas não coincidem.</p>
              )}
            </div>

            {/* Checklist de Requisitos de Senha */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Requisitos Obrigatórios de Senha:
              </span>
              <ul className="space-y-1.5 text-xs">
                <li className={`flex items-center gap-2 ${passwordCriteria.minLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.minLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Mínimo de 12 caracteres</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Pelo menos 1 letra maiúscula (A-Z)</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasLower ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasLower ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Pelo menos 1 letra minúscula (a-z)</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Pelo menos 1 número (0-9)</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Pelo menos 1 caractere especial (!@#$...)</span>
                </li>
              </ul>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSendingCode || !isStep1Valid}
              data-testid="btn-submit-register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Código de Verificação...</span>
                </>
              ) : (
                <>
                  <span>Criar Conta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
