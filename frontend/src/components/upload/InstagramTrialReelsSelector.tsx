import React from 'react';
import { Sparkles, Lock, Users, Instagram, CheckCircle2, Sliders } from 'lucide-react';
import { InstagramProfile } from '../../types';

interface InstagramTrialReelsSelectorProps {
  igProfile: InstagramProfile | null;
  isTrialReel: boolean;
  setIsTrialReel: (val: boolean) => void;
  graduationStrategy: 'MANUAL' | 'SS_PERFORMANCE';
  setGraduationStrategy: (val: 'MANUAL' | 'SS_PERFORMANCE') => void;
}

export const InstagramTrialReelsSelector: React.FC<InstagramTrialReelsSelectorProps> = ({
  igProfile,
  isTrialReel,
  setIsTrialReel,
  graduationStrategy,
  setGraduationStrategy,
}) => {
  const minFollowers = igProfile?.min_followers_for_trial || 1000;
  const followersCount = igProfile?.followers_count ?? 0;
  const isEligible = Boolean(igProfile?.trial_reels_eligible || followersCount >= minFollowers);
  const displayHandle = igProfile?.account_name || (igProfile?.username ? `@${igProfile.username}` : '@instagram');
  const progressPct = Math.min(100, Math.round((followersCount / minFollowers) * 100));

  const handleToggleTrial = () => {
    if (!isEligible) return;
    setIsTrialReel(!isTrialReel);
  };

  return (
    <div
      data-testid="instagram-trial-reels-card"
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
    >
      {/* Cabeçalho com @ e Seguidores no canto superior direito */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-pink-100 text-pink-600 border border-pink-200 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Reels de Teste (Trial Reels)
              </h5>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                Apenas Não-Seguidores
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Publique primeiro apenas para não-seguidores para testar a performance sem exibir no feed dos seus seguidores atuais.
            </p>
          </div>
        </div>

        {/* Badge no canto superior direito mostrando @ do Instagram e seguidores atuais */}
        <div
          data-testid="trial-card-ig-profile-badge"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-pink-200 text-xs shadow-2xs shrink-0"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-600" />
          <span className="font-bold text-pink-700" data-testid="trial-card-ig-username">
            {displayHandle}
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700" data-testid="trial-card-ig-followers">
            <Users className="w-3 h-3 text-slate-500" />
            {followersCount.toLocaleString('pt-BR')} seguidores
          </span>
        </div>
      </div>

      {/* Aviso de restrição quando tiver menos de 1.000 seguidores */}
      {!isEligible ? (
        <div
          data-testid="trial-reels-restriction-banner"
          className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Para habilitar o Reels de Teste é necessário ter pelo menos {minFollowers.toLocaleString('pt-BR')} seguidores
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Restrição oficial da API do Instagram: sua conta <strong>{displayHandle}</strong> possui atualmente{' '}
                  <strong>{followersCount.toLocaleString('pt-BR')} seguidores</strong> (faltam{' '}
                  <strong>{Math.max(0, minFollowers - followersCount).toLocaleString('pt-BR')}</strong> para liberar).
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              data-testid="toggle-trial-reel"
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-500 font-semibold text-xs cursor-not-allowed shrink-0 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloqueado (&lt; 1.000)</span>
            </button>
          </div>

          {/* Barra de progresso até 1.000 seguidores */}
          <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Publicar como Reels de Teste (Trial Reel)
                </p>
                <p className="text-[11px] text-slate-500">
                  Sua conta ({followersCount.toLocaleString('pt-BR')} seguidores) atende ao requisito mínimo de 1.000 seguidores.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTrial}
              data-testid="toggle-trial-reel"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isTrialReel
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {isTrialReel ? 'Ativado' : 'Ativar Reels de Teste'}
            </button>
          </div>

          {isTrialReel && (
            <div
              data-testid="trial-graduation-strategy-box"
              className="p-3 rounded-lg bg-pink-50/60 border border-pink-200 space-y-2"
            >
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-pink-800 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Quando compartilhar com seus seguidores?</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGraduationStrategy('MANUAL')}
                  data-testid="btn-strategy-manual"
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    graduationStrategy === 'MANUAL'
                      ? 'bg-white border-pink-500 text-pink-800 font-semibold shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">Manualmente (MANUAL)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Você decide depois no app quando liberar para seus seguidores.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setGraduationStrategy('SS_PERFORMANCE')}
                  data-testid="btn-strategy-performance"
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    graduationStrategy === 'SS_PERFORMANCE'
                      ? 'bg-white border-pink-500 text-pink-800 font-semibold shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">Automático por Desempenho</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    O Instagram compartilha automaticamente se performar bem em 72h.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
