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

  // Avança para a etapa de verificação (dispara código via Brevo)
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

  // Reenviar código a partir do Painel 2
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

  // Submissão final do cadastro com o código OTP
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
      className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-pink-500 selection:text-white"
    >
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/60 z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 p-[1px] shadow-lg shadow-pink-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-pink-400" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Multi<span className="text-pink-500">Post</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma Unificada de Publicação e Agendamento
          </p>
        </div>

        {isValidatingToken && (
          <div data-testid="validating-token-state" className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">Validando seu link de convite...</p>
          </div>
        )}

        {!isValidatingToken && tokenError && (
          <div data-testid="token-error-state" className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-1">Convite Não Disponível</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{tokenError}</p>
            </div>
            <button
              onClick={onGoToLogin}
              data-testid="btn-error-go-to-login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <span>Ir para Tela de Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isValidatingToken && !tokenError && isSuccess && (
          <div data-testid="register-success-state" className="py-4 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Conta Criada com Sucesso!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Seu e-mail foi validado e sua conta ativada com criptografia Argon2id. Acesse a plataforma com suas credenciais.
              </p>
            </div>
            <button
              onClick={onGoToLogin}
              data-testid="btn-success-go-to-login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-pink-600/25 transition-all cursor-pointer"
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
            {/* Campos falsos ocultos para neutralizar autofill agressivo do Chrome */}
            <input type="text" name="fake_un_multipost" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} autoComplete="off" />
            <input type="password" name="fake_pw_multipost" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} autoComplete="off" />

            <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">Tipo de acesso:</span>
              <span className="font-semibold text-pink-400 capitalize">
                {tokenValidation?.role === 'admin' ? 'Administrador' : 'Usuário (Editor)'}
              </span>
            </div>

            {tokenValidation?.email_service_configured === false && (
              <div
                data-testid="brevo-not-configured-warning"
                className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  O serviço Brevo não está conectado (chave BREVO_API_KEY não configurada no .env). O código OTP não poderá ser disparado.
                </span>
              </div>
            )}

            {formError && (
              <div
                data-testid="register-form-error"
                className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  data-testid="input-register-name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                />
              </div>
            </div>

            {/* E-mail Profissional (sem botão lateral de validar e-mail) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  data-testid="input-register-email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                />
              </div>
            </div>

            {/* WhatsApp com DDI */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp</label>
              <PhoneDdiInput
                value={whatsapp}
                onChange={(val) => setWhatsapp(val)}
                inputTestId="input-register-whatsapp"
                dropdownTestId="dropdown-ddi-trigger"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha forte"
                  data-testid="input-register-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  data-testid="input-register-confirm-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-400 mt-1">As senhas não coincidem.</p>
              )}
            </div>

            {/* Checklist de Requisitos de Senha */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Requisitos Obrigatórios de Senha:
              </span>
              <ul className="space-y-1.5 text-xs">
                <li className={`flex items-center gap-2 ${passwordCriteria.minLength ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Mínimo de 12 caracteres</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Pelo menos 1 letra maiúscula (A-Z)</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasLower ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasLower ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Pelo menos 1 letra minúscula (a-z)</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Pelo menos 1 número (0-9)</span>
                </li>
                <li className={`flex items-center gap-2 ${passwordCriteria.hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Pelo menos 1 caractere especial (!@#$...)</span>
                </li>
              </ul>
            </div>

            {/* Botão de Envio: Criar Conta (avança para validação do e-mail) */}
            <button
              type="submit"
              disabled={isSendingCode || !isStep1Valid}
              data-testid="btn-submit-register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-pink-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
