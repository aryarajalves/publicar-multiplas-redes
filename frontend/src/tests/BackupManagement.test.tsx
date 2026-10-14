import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupManagement } from '../components/backup/BackupManagement';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getBackupStatus: vi.fn(),
    listBackups: vi.fn(),
    triggerManualBackup: vi.fn(),
    getBackupSchedule: vi.fn(),
    updateBackupSchedule: vi.fn(),
    importBackup: vi.fn(),
    getBackupDownloadUrl: vi.fn((id: number) => `/api/backup/download/${id}`),
    restoreBackup: vi.fn(),
    deleteBackup: vi.fn(),
  }
}));

describe('BackupManagement Component', () => {
  const mockStatus = {
    last_backup: {
      id: 1,
      filename: 'multipost_backup_20261014_100000.dump.gz',
      file_size_bytes: 1048576,
      backup_type: 'manual' as const,
      status: 'completed',
      created_at: '2026-10-14T10:00:00Z',
    },
    next_backup_at: '2026-10-15T10:00:00Z',
    frequency_hours: 24,
    is_active: true,
    total_backups: 5,
    retention_limit: 30,
    total_size_bytes: 5242880,
    s3_connected: true,
    bucket_name: 'multipost-backups',
    provider: 'Backblaze B2',
  };

  const mockBackups = [
    {
      id: 1,
      filename: 'multipost_backup_20261014_100000.dump.gz',
      file_size_bytes: 1048576,
      backup_type: 'manual' as const,
      status: 'completed',
      created_at: '2026-10-14T10:00:00Z',
    },
    {
      id: 2,
      filename: 'multipost_backup_20261013_100000.dump.gz',
      file_size_bytes: 2097152,
      backup_type: 'automatic' as const,
      status: 'completed',
      created_at: '2026-10-13T10:00:00Z',
    },
  ];

  const mockSchedule = {
    is_active: true,
    frequency_hours: 24,
    s3_folder: 'multipost/backups/',
    retention_limit: 30,
    last_backup_at: '2026-10-14T10:00:00Z',
    next_backup_at: '2026-10-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(api.getBackupStatus).mockResolvedValue(mockStatus);
    vi.mocked(api.listBackups).mockResolvedValue({
      backups: mockBackups,
      total: 2,
      total_size_bytes: 3145728,
    });
    vi.mocked(api.getBackupSchedule).mockResolvedValue(mockSchedule);
  });


  it('renders header, status cards and subtabs correctly', async () => {
    render(<BackupManagement />);

    expect(screen.getByText('Backup Automático & Armazenamento em Nuvem')).toBeInTheDocument();
    expect(screen.getByText('Backups no S3')).toBeInTheDocument();
    expect(screen.getByText('Agendamento Automático')).toBeInTheDocument();
    expect(screen.getByText('Importar Backup Externo')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('5 / 30 backups')).toBeInTheDocument();
      expect(screen.getByText('Conectado')).toBeInTheDocument();
      expect(screen.getByText(/multipost-backups/)).toBeInTheDocument();
    });
  });

  it('triggers manual backup when Fazer Backup Agora is clicked', async () => {
    vi.mocked(api.triggerManualBackup).mockResolvedValue({
      success: true,
      message: 'Backup manual concluído!',
      backup: mockBackups[0],
    });

    render(<BackupManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-trigger-manual-backup')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-trigger-manual-backup'));

    await waitFor(() => {
      expect(api.triggerManualBackup).toHaveBeenCalledTimes(1);
    });
  });

  it('switches between subtabs (Backups no S3, Agendamento, Importar)', async () => {
    render(<BackupManagement />);

    // Subaba padrão: S3 Backups
    expect(screen.getByText('Execução de Backup Manual')).toBeInTheDocument();

    // Muda para Agendamento Automático
    fireEvent.click(screen.getByTestId('subtab-schedule'));
    await waitFor(() => {
      expect(screen.getByText('Configuração de Backup Periódico')).toBeInTheDocument();
      expect(screen.getByText('Ativar Backup Automático')).toBeInTheDocument();
    });

    // Muda para Importar Backup Externo
    fireEvent.click(screen.getByTestId('subtab-import'));
    await waitFor(() => {
      expect(screen.getByText(/Upload de Backup Externo/)).toBeInTheDocument();
      expect(screen.getByText(/Arraste e solte o arquivo aqui/)).toBeInTheDocument();
    });
  });

  it('saves schedule settings on form submit', async () => {
    vi.mocked(api.updateBackupSchedule).mockResolvedValue({
      ...mockSchedule,
      frequency_hours: 6,
    });

    render(<BackupManagement />);

    fireEvent.click(screen.getByTestId('subtab-schedule'));

    await waitFor(() => {
      expect(screen.getByText('A cada 6 horas')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('A cada 6 horas'));
    fireEvent.click(screen.getByTestId('btn-save-backup-schedule'));

    await waitFor(() => {
      expect(api.updateBackupSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency_hours: 6,
        })
      );
    });
  });

  it('opens and cancels restore confirmation modal', async () => {
    render(<BackupManagement />);

    await waitFor(() => {
      expect(screen.getAllByText('multipost_backup_20261014_100000.dump.gz').length).toBeGreaterThanOrEqual(1);
    });

    // Clica no botão de restaurar
    const restoreButtons = screen.getAllByTitle('Restaurar Banco de Dados');
    fireEvent.click(restoreButtons[0]);

    // Modal deve estar aberto
    expect(screen.getByText('Restaurar Banco de Dados')).toBeInTheDocument();
    expect(screen.getByText(/Ação crítica e irreversível/)).toBeInTheDocument();

    // Clica em Cancelar
    fireEvent.click(screen.getByText('Cancelar'));

    // Modal deve fechar
    await waitFor(() => {
      expect(screen.queryByText(/Ação crítica e irreversível/)).not.toBeInTheDocument();
    });
  });

  it('opens and confirms delete backup modal', async () => {
    vi.mocked(api.deleteBackup).mockResolvedValue({
      success: true,
      message: 'Backup excluído com sucesso.',
    });

    render(<BackupManagement />);

    await waitFor(() => {
      expect(screen.getAllByText('multipost_backup_20261014_100000.dump.gz').length).toBeGreaterThanOrEqual(1);
    });

    const deleteButtons = screen.getAllByTitle('Excluir Backup');
    fireEvent.click(deleteButtons[0]);

    // Modal deve estar aberto
    expect(screen.getByText('Excluir Arquivo de Backup')).toBeInTheDocument();

    // Clica em Confirmar Exclusão
    fireEvent.click(screen.getByText('Confirmar Exclusão'));

    await waitFor(() => {
      expect(api.deleteBackup).toHaveBeenCalledWith(1);
    });
  });


  it('filters backups by type when filter pills are clicked', async () => {
    render(<BackupManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Automático \(/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Automático \(/));

    await waitFor(() => {
      expect(api.listBackups).toHaveBeenCalledWith('automatic');
    });
  });
});
