import React, { useState, useEffect } from 'react';
import { Database, Clock, UploadCloud, RefreshCw, AlertCircle } from 'lucide-react';

import { api } from '../../services/api';
import { BackupRecord, BackupStatusCards, BackupScheduleSettings } from '../../types';
import { BackupSubTab, BackupFilterType } from './types';
import { BackupStatusCardsView } from './BackupStatusCardsView';
import { BackupsTableTab } from './BackupsTableTab';
import { BackupScheduleTab } from './BackupScheduleTab';
import { BackupImportTab } from './BackupImportTab';

export const BackupManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<BackupSubTab>(() => {
    try {
      const saved = localStorage.getItem('multipost_backup_subtab');
      if (saved === 's3_backups' || saved === 'schedule' || saved === 'import') return saved as BackupSubTab;
    } catch {}
    return 's3_backups';
  });
  const [activeFilter, setActiveFilter] = useState<BackupFilterType>('all');

  const [statusCards, setStatusCards] = useState<BackupStatusCards | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<BackupScheduleSettings | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(true);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [creatingManual, setCreatingManual] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadStatus = async () => {
    try {
      setLoadingStatus(true);
      const data = await api.getBackupStatus();
      setStatusCards(data);
    } catch (err) {
      console.error('Erro ao carregar status do backup:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadBackups = async (filter?: BackupFilterType) => {
    try {
      setLoadingBackups(true);
      const res = await api.listBackups(filter || activeFilter);
      setBackups(res.backups || []);
    } catch (err) {
      console.error('Erro ao carregar lista de backups:', err);
      showToast('Falha ao obter lista de backups.', 'error');
    } finally {
      setLoadingBackups(false);
    }
  };

  const loadSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await api.getBackupSchedule();
      setScheduleSettings(res);
    } catch (err) {
      console.error('Erro ao carregar configurações de agendamento:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadBackups();
    loadSchedule();
  }, []);

  const handleRefreshAll = () => {
    loadStatus();
    loadBackups();
    if (activeSubTab === 'schedule') {
      loadSchedule();
    }
  };

  const handleFilterChange = (filter: BackupFilterType) => {
    setActiveFilter(filter);
    loadBackups(filter);
  };

  const handleTriggerManualBackup = async () => {
    try {
      setCreatingManual(true);
      const res = await api.triggerManualBackup();
      if (res.success) {
        showToast(res.message || 'Backup manual criado com sucesso!', 'success');
        await Promise.all([loadStatus(), loadBackups()]);
      } else {
        showToast(res.message || 'Erro ao gerar backup.', 'error');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Falha ao executar backup manual.';
      showToast(msg, 'error');
    } finally {
      setCreatingManual(false);
    }
  };

  const handleDownload = (backup: BackupRecord) => {
    const downloadUrl = api.getBackupDownloadUrl(backup.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', backup.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = async (backup: BackupRecord) => {
    try {
      const res = await api.restoreBackup(backup.id);
      if (res.success) {
        showToast(res.message || 'Banco de dados restaurado com sucesso!', 'success');
        await loadStatus();
      } else {
        showToast(res.message || 'Falha na restauração.', 'error');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao restaurar banco de dados.';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (backup: BackupRecord) => {
    try {
      const res = await api.deleteBackup(backup.id);
      if (res.success) {
        showToast('Backup excluído permanentemente.', 'success');
        await Promise.all([loadStatus(), loadBackups()]);
      } else {
        showToast(res.message || 'Falha ao excluir backup.', 'error');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao excluir backup.';
      showToast(msg, 'error');
    }
  };

  const handleSaveSchedule = async (updated: BackupScheduleSettings) => {
    try {
      const res = await api.updateBackupSchedule(updated);
      setScheduleSettings(res);
      showToast('Configurações de agendamento salvas com sucesso!', 'success');
      await loadStatus();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao salvar agendamento.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleImportFile = async (file: File) => {
    const res = await api.importBackup(file);
    if (res.success) {
      showToast(`Arquivo "${file.name}" importado com sucesso!`, 'success');
      await Promise.all([loadStatus(), loadBackups()]);
      setActiveSubTab('s3_backups');
    }
  };

  const handleSelectSubTab = (subTab: BackupSubTab) => {
    setActiveSubTab(subTab);
    try {
      localStorage.setItem('multipost_backup_subtab', subTab);
    } catch {}
    if (subTab === 'schedule') {
      loadSchedule();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn" data-testid="backup-management-view">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md border animate-slideUp ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Geral */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Backup Automático & Armazenamento em Nuvem
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-10">
            Gerencie backups do banco de dados PostgreSQL com sincronização direta no Backblaze B2 (S3) e políticas de retenção.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={loadingStatus || loadingBackups}
          className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
          title="Recarregar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus || loadingBackups ? 'animate-spin text-pink-400' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* 4 Cards Superiores de Métricas */}
      <BackupStatusCardsView status={statusCards} loading={loadingStatus} />

      {/* Navegação entre as 3 Subabas */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => handleSelectSubTab('s3_backups')}
          data-testid="subtab-s3-backups"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeSubTab === 's3_backups'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm shadow-pink-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backups no S3</span>
        </button>

        <button
          onClick={() => handleSelectSubTab('schedule')}
          data-testid="subtab-schedule"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeSubTab === 'schedule'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm shadow-pink-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Agendamento Automático</span>
        </button>

        <button
          onClick={() => handleSelectSubTab('import')}
          data-testid="subtab-import"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeSubTab === 'import'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm shadow-pink-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >

          <UploadCloud className="w-3.5 h-3.5" />
          <span>Importar Backup Externo</span>
        </button>
      </div>

      {/* Conteúdo da Subaba Ativa */}
      <div>
        {activeSubTab === 's3_backups' && (
          <BackupsTableTab
            backups={backups}
            loading={loadingBackups}
            creatingManual={creatingManual}
            onTriggerManualBackup={handleTriggerManualBackup}
            onDownload={handleDownload}
            onRestore={handleRestore}
            onDelete={handleDelete}
            activeFilter={activeFilter}
            onChangeFilter={handleFilterChange}
          />
        )}

        {activeSubTab === 'schedule' && (
          <BackupScheduleTab
            settings={scheduleSettings}
            loading={loadingSchedule}
            onSave={handleSaveSchedule}
          />
        )}

        {activeSubTab === 'import' && (
          <BackupImportTab
            onImportFile={handleImportFile}
            loading={loadingBackups}
          />
        )}
      </div>
    </div>
  );
};
