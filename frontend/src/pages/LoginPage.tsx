import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Play,
  Share2,
  TrendingUp,
  CheckCircle2,
  Zap,
  Layers
} from 'lucide-react';
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
      className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-800 overflow-hidden selection:bg-[#ea384c] selection:text-white"
    >
      {/* ======================================================== */}
      {/* COLUNA ESQUERDA: FORMULÁRIO DE LOGIN                      */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[48%] xl:w-[42%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white border-r border-slate-200/80 z-10 overflow-y-auto">
        {/* Topo: Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20 shrink-0">
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900 tracking-tight">MultiPost</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 rounded border border-red-200">PRO</span>
            </div>
            <p className="text-[11px] text-slate-500">Hub de Distribuição Automática</p>
          </div>
        </div>

        {/* Centro: Formulário de Autenticação */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto lg:mx-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-[#ea384c]" />
            <span>MultiPost PRO Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Acessar Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Informe seu e-mail e senha para gerenciar suas publicações
          </p>

          {/* Alerta de Erro */}
          {error && (
            <div
              data-testid="login-error-alert"
              className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@multipost.com"
                  data-testid="input-login-email"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="input-login-password"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
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

          {/* Preencher credenciais padrão */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              data-testid="btn-fill-demo-credentials"
              className="text-xs text-slate-500 hover:text-[#ea384c] transition-colors inline-flex items-center gap-1.5 cursor-pointer underline-offset-2 hover:underline"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preencher credenciais padrão (admin@multipost.com)</span>
            </button>
          </div>
        </div>

        {/* Rodapé: Links Legais */}
        <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/politicaprivacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              Privacidade
            </a>
            <span>•</span>
            <a
              href="/termosdeuso"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              Termos de Uso
            </a>
          </div>
          <span>&copy; {new Date().getFullYear()} MultiPost</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUNA DIREITA: HERO VISUAL REPRESENTATIVO (FAST-LOAD)    */}
      {/* ======================================================== */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-[#190812] overflow-hidden items-center justify-center p-8 xl:p-14 text-white select-none">
        {/* Efeitos de Luz de Fundo (Neon Glow) */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#ea384c]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl w-full space-y-8">
          {/* Badge de Destaque */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-rose-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Distribuição Simultânea em 1 Clique</span>
          </div>

          {/* Título e Proposta de Valor */}
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Publique uma vez, alcance todas as redes sociais.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Agendamento automatizado, cross-posting inteligente com captação de métricas reais e diagnóstico de ganchos com IA para YouTube, Instagram e TikTok.
            </p>
          </div>

          {/* Card Mockup Central de Demonstração */}
          <div className="relative bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
            {/* Header do Mockup */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Publicação Sincronizada Ativa</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                100% Automatizado
              </span>
            </div>

            {/* Redes Sincronizadas com Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xs font-bold">
                  YT
                </div>
                <p className="text-[11px] font-bold text-slate-200">YouTube</p>
                <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto text-xs font-bold">
                  IG
                </div>
                <p className="text-[11px] font-bold text-slate-200">Instagram</p>
                <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto text-xs font-bold">
                  TT
                </div>
                <p className="text-[11px] font-bold text-slate-200">TikTok</p>
                <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              </div>
            </div>

            {/* Mini Dashboard de Métricas com IA */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ea384c]/20 text-[#ea384c] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Retenção de Gancho com IA</p>
                  <p className="text-[11px] text-slate-400">Score 8.9/10 • +3.4x alcance orgânico</p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                🔥 Alta Performance
              </span>
            </div>
          </div>

          {/* Destaque de Recursos em Linha */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              Cross-Posting
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Raio-X de Ganchos
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              Backup em Nuvem
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
