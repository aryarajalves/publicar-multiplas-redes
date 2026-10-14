import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { LogsManagement } from '../components/LogsManagement';
import { BackupManagement } from '../components/backup/BackupManagement';

vi.mock('../services/api', () => ({

  api: {
    getPlatformOverview: vi.fn().mockResolvedValue({
      total_posts: 0,
      total_scheduled: 0,
      total_published: 0,
      total_failed: 0,
      platforms: [],
    }),

    getPosts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getMonitoredContainers: vi.fn().mockResolvedValue([]),

    getContainerLogs: vi.fn().mockResolvedValue({
      container: 'backend',
      container_name: 'social-publisher-api',
      label: 'Backend (FastAPI)',
      total_lines: 0,
      source: 'docker',
      entries: [],
    }),
    getBackupStatus: vi.fn().mockResolvedValue({
      last_backup: null,
      next_backup_at: null,
      frequency_hours: 24,
      is_active: true,
      total_backups: 0,
      retention_limit: 30,
      total_size_bytes: 0,
      s3_connected: false,
      bucket_name: null,
      provider: 'Backblaze B2',
    }),
    listBackups: vi.fn().mockResolvedValue({ backups: [], total: 0, total_size_bytes: 0 }),
    getBackupSchedule: vi.fn().mockResolvedValue({
      is_active: true,
      frequency_hours: 24,
      s3_folder: 'multipost/backups/',
      retention_limit: 30,
    }),
    listUsers: vi.fn().mockResolvedValue([]),
    listInvitations: vi.fn().mockResolvedValue([]),
    logout: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Tab and Subtab Persistence on Page Refresh', () => {
  const mockUser = {
    id: 1,
    name: 'Super Admin',
    email: 'admin@multipost.com',
    role: 'admin' as const,
    is_active: true,
    created_at: '2026-10-14T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.location.hash = '';
    localStorage.setItem('multipost_user', JSON.stringify(mockUser));
  });

  afterEach(() => {
    localStorage.clear();
    window.location.hash = '';
  });

  it('restores "logs" tab on page reload if previously saved in localStorage', async () => {
    localStorage.setItem('multipost_active_tab', 'logs');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('logs-management-page')).toBeInTheDocument();
      expect(screen.getByText('Docker Live')).toBeInTheDocument();
    });
  });

  it('restores "backup" tab on page reload if previously saved in localStorage', async () => {
    localStorage.setItem('multipost_active_tab', 'backup');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('backup-management-view')).toBeInTheDocument();
      expect(screen.getByText('Backup Automático & Armazenamento em Nuvem')).toBeInTheDocument();
    });
  });

  it('restores "users" tab on page reload if hash is #users', async () => {
    window.location.hash = '#users';

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('users-management-view')).toBeInTheDocument();
    });

  });

  it('updates localStorage and hash when switching tabs in Sidebar', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-btn-logs')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sidebar-btn-logs'));

    expect(localStorage.getItem('multipost_active_tab')).toBe('logs');
    expect(window.location.hash).toBe('#logs');

    fireEvent.click(screen.getByTestId('sidebar-btn-backup'));

    expect(localStorage.getItem('multipost_active_tab')).toBe('backup');
    expect(window.location.hash).toBe('#backup');
  });

  it('persists selected container in LogsManagement component', async () => {
    localStorage.setItem('multipost_logs_container', 'frontend');

    render(<LogsManagement />);

    await waitFor(() => {
      const frontendBtn = screen.getByTestId('tab-container-frontend');
      expect(frontendBtn.className).toContain('border-[#ea384c]');
    });

    // Clica no contêiner worker
    fireEvent.click(screen.getByTestId('tab-container-worker'));
    expect(localStorage.getItem('multipost_logs_container')).toBe('worker');
  });

  it('persists selected subtab in BackupManagement component', async () => {
    localStorage.setItem('multipost_backup_subtab', 'schedule');

    render(<BackupManagement />);

    await waitFor(() => {
      expect(screen.getByText('Configuração de Backup Periódico')).toBeInTheDocument();
    });

    // Clica na subaba importar
    fireEvent.click(screen.getByTestId('subtab-import'));
    expect(localStorage.getItem('multipost_backup_subtab')).toBe('import');
  });
});
