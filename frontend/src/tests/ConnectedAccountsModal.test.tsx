import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectedAccountsModal } from '../components/ConnectedAccountsModal';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getConnectedAccounts: vi.fn(),
    getTikTokLoginUrl: vi.fn(),
    disconnectTikTok: vi.fn(),
  },
}));

describe('ConnectedAccountsModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<ConnectedAccountsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('connected-accounts-modal')).not.toBeInTheDocument();
  });

  it('renders modal with accounts data when open', async () => {
    (api.getConnectedAccounts as any).mockResolvedValueOnce({
      tiktok: { connected: false },
      youtube: { connected: true, account_name: 'Canal Oficial' },
      instagram: { connected: true, account_name: 'Reels Oficial' },
    });

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('connected-accounts-modal')).toBeInTheDocument();
    expect(screen.getByText('Contas & Integrações')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Instagram Reels')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.getConnectedAccounts).toHaveBeenCalledTimes(1);
    });
  });

  it('shows "Conectar TikTok" button when TikTok is disconnected and triggers popup on click', async () => {
    (api.getConnectedAccounts as any).mockResolvedValueOnce({
      tiktok: { connected: false },
      youtube: { connected: false },
      instagram: { connected: false },
    });
    (api.getTikTokLoginUrl as any).mockResolvedValueOnce({
      url: 'https://www.tiktok.com/v2/auth/authorize/?client_key=123',
      state: 'xyz',
    });

    const originalOpen = window.open;
    window.open = vi.fn();

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-connect-tiktok')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-connect-tiktok'));

    await waitFor(() => {
      expect(api.getTikTokLoginUrl).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith(
        'https://www.tiktok.com/v2/auth/authorize/?client_key=123',
        'TikTokOAuthWindow',
        expect.any(String)
      );
    });

    window.open = originalOpen;
  });

  it('shows "Desconectar" button when TikTok is connected and handles disconnect', async () => {
    (api.getConnectedAccounts as any).mockResolvedValueOnce({
      tiktok: { connected: true, account_name: '@criador_oficial' },
      youtube: { connected: true },
      instagram: { connected: true },
    });
    (api.disconnectTikTok as any).mockResolvedValueOnce({ success: true, message: 'Ok' });

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-disconnect-tiktok')).toBeInTheDocument();
      expect(screen.getByText('@criador_oficial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-disconnect-tiktok'));

    await waitFor(() => {
      expect(api.disconnectTikTok).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when close button is clicked', async () => {
    (api.getConnectedAccounts as any).mockResolvedValueOnce({
      tiktok: { connected: false },
      youtube: { connected: false },
      instagram: { connected: false },
    });

    const handleClose = vi.fn();
    render(<ConnectedAccountsModal isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByTestId('btn-close-accounts-modal'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('recovers from loading state when popup window is closed manually by user', async () => {
    (api.getConnectedAccounts as any).mockResolvedValue({
      tiktok: { connected: false },
      youtube: { connected: false },
      instagram: { connected: false },
    });
    (api.getTikTokLoginUrl as any).mockResolvedValueOnce({
      url: 'https://www.tiktok.com/v2/auth/authorize/?client_key=123',
    });

    const mockPopup = { closed: false };
    const originalOpen = window.open;
    window.open = vi.fn().mockReturnValue(mockPopup);

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-connect-tiktok')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-connect-tiktok'));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalled();
    });

    // Simula o usuário fechando a janela do popup manualmente
    mockPopup.closed = true;

    // Aguarda o intervalo de 500ms detectar o fechamento e reabilitar o botão
    await waitFor(
      () => {
        const btn = screen.getByTestId('btn-connect-tiktok');
        expect(btn).not.toBeDisabled();
      },
      { timeout: 2500 }
    );

    window.open = originalOpen;
  });

  it('handles TIKTOK_AUTH_SUCCESS message and updates UI', async () => {
    (api.getConnectedAccounts as any)
      .mockResolvedValueOnce({
        tiktok: { connected: false },
        youtube: { connected: false },
        instagram: { connected: false },
      })
      .mockResolvedValueOnce({
        tiktok: { connected: true, account_name: '@novocriador' },
        youtube: { connected: false },
        instagram: { connected: false },
      });

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-connect-tiktok')).toBeInTheDocument();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TIKTOK_AUTH_SUCCESS', account: '@novocriador' },
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Conta do TikTok conectada com sucesso!')).toBeInTheDocument();
    });
  });

  it('handles TIKTOK_AUTH_ERROR message and displays feedback', async () => {
    (api.getConnectedAccounts as any).mockResolvedValue({
      tiktok: { connected: false },
      youtube: { connected: false },
      instagram: { connected: false },
    });

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-connect-tiktok')).toBeInTheDocument();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TIKTOK_AUTH_ERROR', message: 'Permissão negada pelo usuário' },
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Permissão negada pelo usuário')).toBeInTheDocument();
    });
  });

  it('renders TikTok redirect URI and allows copying it to clipboard', async () => {
    (api.getConnectedAccounts as any).mockResolvedValueOnce({
      tiktok: {
        connected: false,
        redirect_uri: 'http://localhost:8005/api/auth/tiktok/callback',
      },
      youtube: { connected: false },
      instagram: { connected: false },
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<ConnectedAccountsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('text-redirect-uri')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:8005/api/auth/tiktok/callback')).toBeInTheDocument();
    });

    const copyBtn = screen.getByTestId('btn-copy-redirect-uri');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:8005/api/auth/tiktok/callback'
    );

    await waitFor(() => {
      expect(screen.getByText('Copiada!')).toBeInTheDocument();
    });
  });
});
