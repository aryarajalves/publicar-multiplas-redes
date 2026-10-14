import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  RotateCcw, 
  Trash2, 
  FileText, 
  AlertTriangle, 
  Loader2
} from 'lucide-react';

import { BackupRecord } from '../../types';
import { formatDateTimeBRT, formatFileSize, BackupFilterType } from './types';

interface BackupsTableTabProps {
  backups: BackupRecord[];
  loading: boolean;
  creatingManual: boolean;
  onTriggerManualBackup: () => void;
  onDownload: (backup: BackupRecord) => void;
  onRestore: (backup: BackupRecord) => Promise<void>;
  onDelete: (backup: BackupRecord) => Promise<void>;
  activeFilter: BackupFilterType;
  onChangeFilter: (filter: BackupFilterType) => void;
}

export const BackupsTableTab: React.FC<BackupsTableTabProps> = ({
  backups,
  loading,
  creatingManual,
  onTriggerManualBackup,
  onDownload,
  onRestore,
  onDelete,
  activeFilter,
  onChangeFilter,
}) => {
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<BackupRecord | null>(null);
  const [selectedBackupToDelete, setSelectedBackupToDelete] = useState<BackupRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Contadores
  const totalCount = backups.length;
  const autoCount = backups.filter(b => b.backup_type === 'automatic').length;
  const manualCount = backups.filter(b => b.backup_type === 'manual').length;
  const importedCount = backups.filter(b => b.backup_type === 'imported').length;

  const filteredBackups = backups.filter(b => {
    if (activeFilter === 'all') return true;
    return b.backup_type === activeFilter;
  });

  const handleConfirmRestore = async () => {
    if (!selectedBackupToRestore) return;
    try {
      setActionLoading(true);
      await onRestore(selectedBackupToRestore);
      setSelectedBackupToRestore(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBackupToDelete) return;
    try {
      setActionLoading(true);
      await onDelete(selectedBackupToDelete);
      setSelectedBackupToDelete(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Execução de Backup Manual */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-pink-500/30 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-pink-500/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <h3 className="text-sm font-semibold text-white">Execução de Backup Manual</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Inicie um dump imediato de todas as tabelas do PostgreSQL e envie diretamente para o bucket Backblaze B2 com retenção automatizada.
          </p>
        </div>
        <button
          onClick={onTriggerManualBackup}
          disabled={creatingManual || loading}
          data-testid="btn-trigger-manual-backup"
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {creatingManual ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando Backup...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Fazer Backup Agora</span>
            </>
          )}
        </button>
      </div>

      {/* Barra de Filtros e Contadores */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => onChangeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => onChangeFilter('automatic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeFilter === 'automatic'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Automático ({autoCount})
          </button>
          <button
            onClick={() => onChangeFilter('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeFilter === 'manual'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual ({manualCount})
          </button>
          <button
            onClick={() => onChangeFilter('imported')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeFilter === 'imported'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Importado ({importedCount})
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {filteredBackups.length} backup{filteredBackups.length !== 1 ? 's' : ''} listado{filteredBackups.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabela de Backups */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">Arquivo</th>
                <th className="py-3 px-4">Tamanho</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Criado em (BRT)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-500" />
                    <span>Carregando lista de backups...</span>
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-medium text-slate-300">Nenhum backup encontrado</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {activeFilter === 'all'
                        ? 'Clique em "Fazer Backup Agora" para criar o primeiro snapshot.'
                        : `Nenhum backup do tipo "${activeFilter}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-pink-400 shrink-0" />
                        <span className="truncate max-w-xs md:max-w-md" title={item.filename}>
                          {item.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {formatFileSize(item.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.backup_type === 'automatic' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          Automático
                        </span>
                      ) : item.backup_type === 'imported' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Importado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDateTimeBRT(item.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onDownload(item)}
                          title="Fazer Download do Dump"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBackupToRestore(item)}
                          title="Restaurar Banco de Dados"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBackupToDelete(item)}
                          title="Excluir Backup"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE RESTAURAÇÃO (Padrão de Popups com backdrop fixo) */}
      {selectedBackupToRestore && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-amber-500/10 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Restaurar Banco de Dados</h3>
                <p className="text-xs text-slate-400">Ação crítica e irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Você está prestes a restaurar o banco de dados a partir do arquivo{' '}
              <strong className="text-white font-mono break-all">{selectedBackupToRestore.filename}</strong>.
              Todas as tabelas serão restauradas para o estado deste snapshot.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupToRestore(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Confirmar Restauração</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (Padrão de Popups com backdrop fixo) */}
      {selectedBackupToDelete && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-rose-500/10 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Excluir Arquivo de Backup</h3>
                <p className="text-xs text-slate-400">Confirmação de exclusão permanente</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Tem certeza que deseja apagar o arquivo{' '}
              <strong className="text-white font-mono break-all">{selectedBackupToDelete.filename}</strong>?
              Ele será removido permanentemente do Backblaze B2 e do armazenamento local.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupToDelete(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
