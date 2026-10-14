import React from 'react';
import { Calendar, Clock, Database, Cloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BackupStatusCards } from '../../types';
import { formatDateTimeBRT, formatFileSize } from './types';

interface BackupStatusCardsViewProps {
  status: BackupStatusCards | null;
  loading: boolean;
}

export const BackupStatusCardsView: React.FC<BackupStatusCardsViewProps> = ({ status, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Último Backup */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Último Backup</span>
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white tracking-tight">
            {loading ? (
              <span className="animate-pulse text-slate-500">Carregando...</span>
            ) : status?.last_backup ? (
              formatDateTimeBRT(status.last_backup.created_at)
            ) : (
              'Nenhum backup'
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate" title={status?.last_backup?.filename || 'Sem histórico'}>
            {status?.last_backup ? status.last_backup.filename : 'Nenhum arquivo gerado'}
          </p>
        </div>
      </div>

      {/* Card 2: Próximo Backup */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Próximo Backup</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white tracking-tight">
            {loading ? (
              <span className="animate-pulse text-slate-500">Carregando...</span>
            ) : status?.is_active && status?.next_backup_at ? (
              formatDateTimeBRT(status.next_backup_at)
            ) : (
              <span className="text-slate-400">Agendamento inativo</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {status?.is_active
              ? `Frequência: a cada ${status.frequency_hours} hora${status.frequency_hours > 1 ? 's' : ''}`
              : 'Ative na aba de agendamento'}
          </p>
        </div>
      </div>

      {/* Card 3: Retenção no S3 / B2 */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Retenção no S3 / B2</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-base font-semibold text-white tracking-tight">
            {loading ? (
              <span className="animate-pulse text-slate-500">...</span>
            ) : (
              `${status?.total_backups || 0} / ${status?.retention_limit || 30} backups`
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Espaço: {formatFileSize(status?.total_size_bytes || 0)} utilizados
          </p>
        </div>
      </div>

      {/* Card 4: Status do Backblaze B2 */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Status do Backblaze B2</span>
          <div className={`p-2 rounded-xl border ${
            status?.s3_connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <Cloud className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            {status?.s3_connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">Conectado</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">Desconectado</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate" title={status?.s3_connected ? `Bucket: ${status?.bucket_name}` : 'Armazenamento local / configure chaves no .env'}>
            {status?.s3_connected ? `Bucket: ${status?.bucket_name || 'B2'}` : 'Local (chaves B2 ausentes)'}
          </p>
        </div>
      </div>
    </div>
  );
};
