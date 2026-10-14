import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogsManagement } from '../components/LogsManagement';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getMonitoredContainers: vi.fn(),
    getContainerLogs: vi.fn(),
  },
}));

describe('LogsManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    (api.getMonitoredContainers as any).mockResolvedValue([
      {
        key: 'backend',
        name: 'social-publisher-api',
        label: 'Backend (FastAPI)',
        description: 'API FastAPI',
        status: 'running',
      },
      {
        key: 'frontend',
        name: 'social-stream-web',
        label: 'Frontend (Nginx)',
        description: 'Servidor Nginx',
        status: 'running',
      },
      {
        key: 'worker',
        name: 'social-scheduler-worker',
        label: 'Scheduler Worker',
        description: 'Worker Celery',
        status: 'running',
      },
    ]);

    (api.getContainerLogs as any).mockResolvedValue({
      container: 'backend',
      container_name: 'social-publisher-api',
      label: 'Backend (FastAPI)',
      total_lines: 3,
      source: 'docker_socket',
      entries: [
        {
          timestamp: '2026-10-14T12:00:00Z',
          level: 'INFO',
          stream: 'stdout',
          message: 'Uvicorn running on http://0.0.0.0:8000',
        },
        {
          timestamp: '2026-10-14T12:00:01Z',
          level: 'WARN',
          stream: 'stderr',
          message: 'High memory usage detected',
        },
        {
          timestamp: '2026-10-14T12:00:02Z',
          level: 'ERROR',
          stream: 'stderr',
          message: 'Database connection failed',
        },
      ],
    });
  });

  it('renders header, container tabs, and logs terminal', async () => {
    render(<LogsManagement />);

    expect(screen.getByTestId('logs-management-page')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Logs')).toBeInTheDocument();
    expect(screen.getByText('Docker Live')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.getContainerLogs).toHaveBeenCalledWith({
        container: 'backend',
        tail: 150,
      });
      expect(screen.getByText('Uvicorn running on http://0.0.0.0:8000')).toBeInTheDocument();
      expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });

  it('switches container tab to frontend and fetches frontend logs', async () => {
    (api.getContainerLogs as any).mockResolvedValueOnce({
      container: 'backend',
      container_name: 'social-publisher-api',
      total_lines: 1,
      entries: [
        {
          timestamp: '2026-10-14T12:00:00Z',
          level: 'INFO',
          stream: 'stdout',
          message: 'Backend Log Line',
        },
      ],
    });

    render(<LogsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Backend Log Line')).toBeInTheDocument();
    });

    (api.getContainerLogs as any).mockResolvedValueOnce({
      container: 'frontend',
      container_name: 'social-stream-web',
      total_lines: 1,
      entries: [
        {
          timestamp: '2026-10-14T12:00:05Z',
          level: 'INFO',
          stream: 'stdout',
          message: 'Nginx GET / HTTP/1.1 200 OK',
        },
      ],
    });

    fireEvent.click(screen.getByTestId('tab-container-frontend'));

    await waitFor(() => {
      expect(api.getContainerLogs).toHaveBeenCalledWith({
        container: 'frontend',
        tail: 150,
      });
      expect(screen.getByText('Nginx GET / HTTP/1.1 200 OK')).toBeInTheDocument();
    });
  });

  it('filters logs by search query and severity level', async () => {
    render(<LogsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    // Filtra pelo nível ERROR
    fireEvent.click(screen.getByTestId('filter-level-error'));
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    expect(screen.queryByText('Uvicorn running on http://0.0.0.0:8000')).not.toBeInTheDocument();

    // Filtra por texto
    fireEvent.click(screen.getByTestId('filter-level-all'));
    const searchInput = screen.getByTestId('input-filter-logs');
    fireEvent.change(searchInput, { target: { value: 'memory' } });

    expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
    expect(screen.queryByText('Database connection failed')).not.toBeInTheDocument();
  });

  it('toggles auto-refresh state when clicked', async () => {
    render(<LogsManagement />);

    const toggleBtn = screen.getByTestId('btn-toggle-autorefresh');
    expect(screen.getByText('Auto (4s)')).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText('Pausado')).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText('Auto (4s)')).toBeInTheDocument();
  });

  it('copies logs to clipboard when copy button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<LogsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Uvicorn running on http://0.0.0.0:8000')).toBeInTheDocument();
    });

    const copyBtn = screen.getByTestId('btn-copy-logs');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('displays error message when API call fails', async () => {
    (api.getContainerLogs as any).mockRejectedValueOnce({
      response: { data: { detail: 'Docker socket não encontrado' } },
    });

    render(<LogsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Docker socket não encontrado')).toBeInTheDocument();
    });
  });

  it('formats timestamps in Horário de Brasília (America/Sao_Paulo)', async () => {
    (api.getContainerLogs as any).mockResolvedValueOnce({
      container: 'backend',
      total_lines: 1,
      entries: [
        {
          timestamp: '2026-10-14T13:07:25Z',
          level: 'INFO',
          stream: 'stdout',
          message: 'Started server process',
        },
      ],
    });

    render(<LogsManagement />);

    // 13:07:25 UTC convertido para Horário de Brasília (UTC-3) é 10:07:25
    await waitFor(() => {
      expect(screen.getByText('10:07:25')).toBeInTheDocument();
    });
  });
});
