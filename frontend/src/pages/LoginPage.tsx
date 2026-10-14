import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!password) {
      setError('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response && response.user) {
        onLoginSuccess(response.user);
      } else {
        setError('Resposta inesperada do servidor.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Falha ao autenticar. Verifique suas credenciais.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@multipost.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-pink-500 selection:text-white"
    >
      {/* Luzes de Fundo Decorativas */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Central de Login */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 rounded-3xl shadow-2xl p-7 sm:p-9 backdrop-blur-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header do Card */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-pink-500/20 border border-slate-700/80 bg-slate-950 flex items-center justify-center mx-auto mb-3.5">
            <img
              src="/logo.jpg"
              alt="MultiPost Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[11px] font-semibold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>MultiPost PRO Hub</span>
          </div>

          <h1 className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Acessar Plataforma
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Informe seu e-mail e senha para gerenciar suas publicações
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div
            data-testid="login-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo E-mail */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@multipost.com"
                data-testid="input-login-email"
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Senha
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="input-login-password"
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isLoading}
            data-testid="btn-submit-login"
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-600/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Entrar no MultiPost</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Dica de acesso padrão para testes rápidos */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            data-testid="btn-fill-demo-credentials"
            className="text-xs text-slate-400 hover:text-pink-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer underline-offset-2 hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preencher credenciais padrão (admin@multipost.com)</span>
          </button>
        </div>

        {/* Links Legais no Rodapé */}
        <div className="mt-5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-3">
          <a
            href="/politicaprivacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            Privacidade
          </a>
          <span>•</span>
          <a
            href="/termosdeuso"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            Termos de Uso
          </a>
        </div>
      </div>
    </div>
  );
};
