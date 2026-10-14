import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteModal } from '../components/InviteModal';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    createInvitation: vi.fn(),
  },
}));

describe('InviteModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('does not render when isOpen is false', () => {
    render(<InviteModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('invite-modal-backdrop')).not.toBeInTheDocument();
  });

  it('renders modal with role options and expiration periods when isOpen is true', () => {
    render(<InviteModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('invite-modal-backdrop')).toBeInTheDocument();
    expect(screen.getAllByText('Gerar Link de Convite').length).toBeGreaterThan(0);
    expect(screen.getByTestId('role-editor-option')).toBeInTheDocument();
    expect(screen.getByTestId('role-admin-option')).toBeInTheDocument();
    expect(screen.getByTestId('expire-24h-option')).toBeInTheDocument();
  });

  it('allows selecting role and expiration then generates invite successfully', async () => {
    const mockInvite = {
      id: 10,
      token: 'tok-abc-123',
      role: 'admin' as const,
      expires_at: '2026-10-15T10:00:00Z',
      is_used: false,
      created_at: '2026-10-13T10:00:00Z',
      invite_url: 'http://localhost:3005/cadastro?token=tok-abc-123',
    };
    (api.createInvitation as any).mockResolvedValueOnce(mockInvite);

    const onInviteGenerated = vi.fn();
    render(<InviteModal isOpen={true} onClose={vi.fn()} onInviteGenerated={onInviteGenerated} />);

    // Seleciona Administrador
    fireEvent.click(screen.getByTestId('role-admin-option'));

    // Seleciona 7 dias (168h)
    fireEvent.click(screen.getByTestId('expire-168h-option'));

    // Clica em Gerar
    fireEvent.click(screen.getByTestId('btn-generate-invite'));

    await waitFor(() => {
      expect(api.createInvitation).toHaveBeenCalledWith({
        role: 'admin',
        expires_in_hours: 168,
      });
      expect(onInviteGenerated).toHaveBeenCalledWith(mockInvite);
    });

    // Exibe link gerado
    expect(screen.getByTestId('invite-link-input')).toHaveValue(mockInvite.invite_url);
    expect(screen.getByText('Link de convite exclusivo gerado com sucesso!')).toBeInTheDocument();

    // Copia link
    fireEvent.click(screen.getByTestId('btn-copy-invite-link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockInvite.invite_url);
    expect(screen.getByText('Copiado!')).toBeInTheDocument();
  });

  it('displays error alert when API call fails', async () => {
    (api.createInvitation as any).mockRejectedValueOnce({
      response: { data: { detail: 'Erro ao conectar com servidor' } },
    });

    render(<InviteModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId('btn-generate-invite'));

    await waitFor(() => {
      expect(screen.getByText('Erro ao conectar com servidor')).toBeInTheDocument();
    });
  });
});
