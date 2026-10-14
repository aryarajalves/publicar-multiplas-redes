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
      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ea384c] animate-ping" />
            <h3 className="text-sm font-bold text-slate-900">Execução de Backup Manual</h3>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Inicie um dump imediato de todas as tabelas do PostgreSQL e envie diretamente para o bucket Backblaze B2 com retenção automatizada.
          </p>
        </div>
        <button
          onClick={onTriggerManualBackup}
          disabled={creatingManual || loading}
          data-testid="btn-trigger-manual-backup"
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#ea384c] hover:bg-[#d82a3e] text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => onChangeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => onChangeFilter('automatic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'automatic'
                ? 'bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Automático ({autoCount})
          </button>
          <button
            onClick={() => onChangeFilter('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'manual'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual ({manualCount})
          </button>
          <button
            onClick={() => onChangeFilter('imported')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'imported'
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Importado ({importedCount})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filteredBackups.length} backup{filteredBackups.length !== 1 ? 's' : ''} listado{filteredBackups.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabela de Backups */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4">Arquivo</th>
                <th className="py-3 px-4">Tamanho</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Criado em (BRT)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ea384c]" />
                    <span>Carregando lista de backups...</span>
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Nenhum backup encontrado</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {activeFilter === 'all'
                        ? 'Clique em "Fazer Backup Agora" para criar o primeiro snapshot.'
                        : `Nenhum backup do tipo "${activeFilter}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#ea384c] shrink-0" />
                        <span className="truncate max-w-xs md:max-w-md font-medium" title={item.filename}>
                          {item.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {formatFileSize(item.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.backup_type === 'automatic' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          Automático
                        </span>
                      ) : item.backup_type === 'imported' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Importado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTimeBRT(item.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onDownload(item)}
                          title="Fazer Download do Dump"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBackupToRestore(item)}
                          title="Restaurar Banco de Dados"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer border border-slate-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBackupToDelete(item)}
                          title="Excluir Backup"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer border border-slate-200"
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

      {/* MODAL DE CONFIRMAÇÃO DE RESTAURAÇÃO */}
      {selectedBackupToRestore && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white border border-amber-300 rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restaurar Banco de Dados</h3>
                <p className="text-xs text-amber-700 font-semibold">Ação crítica e irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Você está prestes a restaurar o banco de dados a partir do arquivo{' '}
              <strong className="text-slate-900 font-mono break-all">{selectedBackupToRestore.filename}</strong>.
              Todas as tabelas serão restauradas para o estado deste snapshot.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupToRestore(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Confirmar Restauração</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {selectedBackupToDelete && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white border border-rose-300 rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Arquivo de Backup</h3>
                <p className="text-xs text-rose-700 font-semibold">Confirmação de exclusão permanente</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tem certeza que deseja apagar o arquivo{' '}
              <strong className="text-slate-900 font-mono break-all">{selectedBackupToDelete.filename}</strong>?
              Ele será removido permanentemente do Backblaze B2 e do armazenamento local.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupToDelete(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#ea384c] hover:bg-[#d82a3e] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
