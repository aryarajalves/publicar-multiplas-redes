import React from 'react';
import { KeyRound, Loader2, ArrowLeft, Send, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface RegisterOtpStepProps {
  email: string;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  isSubmitting: boolean;
  isResending: boolean;
  countdown: number;
  formError: string | null;
  codeSuccessMsg: string | null;
  onConfirm: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}

export const RegisterOtpStep: React.FC<RegisterOtpStepProps> = ({
  email,
  verificationCode,
  setVerificationCode,
  isSubmitting,
  isResending,
  countdown,
  formError,
  codeSuccessMsg,
  onConfirm,
  onResend,
  onBack,
}) => {
  return (
    <form
      data-testid="register-otp-panel"
      onSubmit={onConfirm}
      autoComplete="off"
      className="space-y-4 animate-in fade-in duration-300"
    >
      <div className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">Validação de E-mail</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Enviamos um código de segurança de 6 dígitos para:
        </p>
        <p data-testid="otp-target-email" className="text-xs font-semibold text-pink-400 mt-0.5 break-all">
          {email}
        </p>
      </div>

      {formError && (
        <div
          data-testid="register-form-error"
          className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{formError}</span>
        </div>
      )}

      {codeSuccessMsg && (
        <div
          data-testid="register-code-success"
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{codeSuccessMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2 text-center">
          Digite o código de 6 dígitos recebido
        </label>
        <div className="relative max-w-[240px] mx-auto">
          <input
            type="text"
            required
            autoFocus
            maxLength={6}
            autoComplete="off"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            data-testid="input-register-code"
            className="w-full py-3 bg-slate-950/90 border border-pink-500/50 rounded-2xl text-center text-xl tracking-[0.5em] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 shadow-inner transition-colors"
          />
        </div>
        <p className="text-[11px] text-slate-500 text-center mt-1.5">
          Verifique sua caixa de entrada e pasta de spam.
        </p>
      </div>

      {/* Botão de Finalizar */}
      <button
        type="submit"
        disabled={isSubmitting || verificationCode.trim().length !== 6}
        data-testid="btn-confirm-code-register"
        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-pink-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validando e Criando Conta...</span>
          </>
        ) : (
          <>
            <span>Confirmar Código e Criar Conta</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Ações Secundárias */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          data-testid="btn-back-to-step1"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Corrigir Dados</span>
        </button>

        <button
          type="button"
          onClick={onResend}
          disabled={isResending || countdown > 0 || isSubmitting}
          data-testid="btn-resend-verification-code"
          className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
        >
          {isResending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar Código'}</span>
        </button>
      </div>
    </form>
  );
};
