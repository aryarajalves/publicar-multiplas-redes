import React, { useState, useEffect } from 'react';
import { Save, Clock, Folder, ShieldCheck, Power, Check, Loader2 } from 'lucide-react';
import { BackupScheduleSettings } from '../../types';

interface BackupScheduleTabProps {
  settings: BackupScheduleSettings | null;
  loading: boolean;
  onSave: (updated: BackupScheduleSettings) => Promise<void>;
}

export const BackupScheduleTab: React.FC<BackupScheduleTabProps> = ({
  settings,
  loading,
  onSave,
}) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [frequencyHours, setFrequencyHours] = useState<number>(24);
  const [s3Folder, setS3Folder] = useState<string>('multipost/backups/');
  const [retentionLimit, setRetentionLimit] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setIsActive(settings.is_active);
      setFrequencyHours(settings.frequency_hours);
      setS3Folder(settings.s3_folder || 'multipost/backups/');
      setRetentionLimit(settings.retention_limit || 30);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave({
        is_active: isActive,
        frequency_hours: frequencyHours,
        s3_folder: s3Folder.trim() || 'multipost/backups/',
        retention_limit: Math.max(1, Math.min(retentionLimit, 500))
      });
      setSuccessSaved(true);
      setTimeout(() => setSuccessSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const frequencyOptions = [
    { value: 1, label: 'A cada 1 hora' },
    { value: 6, label: 'A cada 6 horas' },
    { value: 12, label: 'A cada 12 horas' },
    { value: 24, label: 'A cada 24 horas (Recomendado)' },
    { value: 168, label: 'A cada 7 dias (Semanal)' },
  ];

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-white">Configuração de Backup Periódico</h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure a rotina automática para extrair dumps do PostgreSQL e enviar para o Backblaze B2.
          </p>
        </div>

        {/* 1. Toggle de Ativação (Largura Total) */}
        <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isActive ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-slate-800 text-slate-500'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Ativar Backup Automático</p>
              <p className="text-[11px] text-slate-400">
                {isActive ? 'A rotina periódica está em execução contínua.' : 'Rotina pausada. Nenhum backup automático será disparado.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
              isActive ? 'bg-pink-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Grid de 2 Colunas para Frequência e Parâmetros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Frequência de Execução */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Frequência de Execução</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {frequencyOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setFrequencyHours(opt.value)}
                  className={`p-3 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                    frequencyHours === opt.value
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 font-semibold shadow-sm shadow-cyan-500/10'
                      : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Intervalo de tempo entre cada snapshot automático do banco de dados.
            </p>
          </div>

          {/* Coluna 2: Pasta S3 e Retenção */}
          <div className="space-y-5">
            {/* 3. Pasta de Destino no S3 / Bucket B2 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Folder className="w-4 h-4 text-purple-400" />
                <span>Pasta de Destino no S3 / Bucket B2</span>
              </label>
              <input
                type="text"
                value={s3Folder}
                onChange={(e) => setS3Folder(e.target.value)}
                placeholder="multipost/backups/"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <p className="text-[11px] text-slate-500">
                Prefixo onde os dumps compactados serão organizados no bucket.
              </p>
            </div>

            {/* 4. Limite de Retenção */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Limite de Retenção (Máximo de Dumps)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={retentionLimit}
                  onChange={(e) => setRetentionLimit(parseInt(e.target.value, 10) || 1)}
                  className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <span className="text-xs text-slate-400">backups armazenados</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Dumps excedentes mais antigos são excluídos automaticamente da nuvem e do armazenamento local.
              </p>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <div>
            {successSaved && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-fadeIn">
                <Check className="w-4 h-4" /> Configurações salvas com sucesso!
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            data-testid="btn-save-backup-schedule"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
