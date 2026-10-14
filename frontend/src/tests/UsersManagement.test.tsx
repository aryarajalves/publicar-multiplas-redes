import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UsersManagement } from '../components/UsersManagement';
import { api } from '../services/api';
import { User, Invitation } from '../types';

vi.mock('../services/api', () => ({
  api: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getInvitations: vi.fn(),
    deleteInvitation: vi.fn(),
    sendUserPasswordReset: vi.fn(),
  },
}));

describe('UsersManagement Component', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      name: 'Admin Master',
      email: 'admin@multipost.com',
      role: 'admin',
      is_active: true,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    },
    {
      id: 2,
      name: 'Editor Junior',
      email: 'junior@multipost.com',
      role: 'editor',
      is_active: true,
      created_at: '2026-10-02T10:00:00Z',
      updated_at: '2026-10-02T10:00:00Z',
    },
    {
      id: 3,
      name: 'Operador Inativo',
      email: 'inativo@multipost.com',
      role: 'editor',
      is_active: false,
      created_at: '2026-10-03T10:00:00Z',
      updated_at: '2026-10-03T10:00:00Z',
    },
  ];

  const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const mockInvitations: Invitation[] = [
    {
      id: 101,
      token: 'token_ativo_pendente_123',
      role: 'admin',
      expires_at: futureDate,
      is_used: false,
      created_at: '2026-10-10T10:00:00Z',
      invite_url: 'http://localhost:3005/cadastro?token=token_ativo_pendente_123',
    },
    {
      id: 102,
      token: 'token_utilizado_456',
      role: 'editor',
      expires_at: futureDate,
      is_used: true,
      used_by_email: 'membro_usado@multipost.com',
      created_at: '2026-10-09T10:00:00Z',
      invite_url: 'http://localhost:3005/cadastro?token=token_utilizado_456',
    },
    {
      id: 103,
      token: 'token_expirado_789',
      role: 'editor',
      expires_at: pastDate,
      is_used: false,
      created_at: '2026-10-01T10:00:00Z',
      invite_url: 'http://localhost:3005/cadastro?token=token_expirado_789',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, subtabs navigation, metrics cards, and lists users', async () => {
    (api.getUsers as any).mockResolvedValueOnce(mockUsers);

    render(<UsersManagement />);

    expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument();
    expect(screen.getByTestId('btn-invite-user')).toBeInTheDocument();
    expect(screen.getByTestId('subtab-users')).toBeInTheDocument();
    expect(screen.getByTestId('subtab-invitations')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
      expect(screen.getByText('Editor Junior')).toBeInTheDocument();
      expect(screen.getByText('Operador Inativo')).toBeInTheDocument();
    });

    // Cards de métricas
    expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('filters users by search input', async () => {
    (api.getUsers as any).mockResolvedValueOnce(mockUsers);

    render(<UsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('input-search-users');
    fireEvent.change(searchInput, { target: { value: 'junior' } });

    expect(screen.getByText('Editor Junior')).toBeInTheDocument();
    expect(screen.queryByText('Admin Master')).not.toBeInTheDocument();
    expect(screen.queryByText('Operador Inativo')).not.toBeInTheDocument();
  });

  it('filters users by role buttons', async () => {
    (api.getUsers as any).mockResolvedValueOnce(mockUsers);

    render(<UsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('filter-role-admin'));
    expect(screen.getByText('Admin Master')).toBeInTheDocument();
    expect(screen.queryByText('Editor Junior')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-role-editor'));
    expect(screen.queryByText('Admin Master')).not.toBeInTheDocument();
    expect(screen.getByText('Editor Junior')).toBeInTheDocument();
  });

  it('opens InviteModal when "+ Gerar Convite" is clicked', async () => {
    (api.getUsers as any).mockResolvedValueOnce([]);

    render(<UsersManagement />);

    fireEvent.click(screen.getByTestId('btn-invite-user'));
    expect(screen.getByTestId('invite-modal-dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Gerar Link de Convite').length).toBeGreaterThan(0);
  });

  it('protects Super Admin: displays protected badge and hides edit/delete buttons', async () => {
    (api.getUsers as any).mockResolvedValueOnce(mockUsers);

    render(<UsersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('user-row-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('super-admin-protected-1')).toBeInTheDocument();
    expect(screen.getByText('Super Admin (Protegido)')).toBeInTheDocument();

    expect(screen.queryByTestId('btn-edit-user-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-delete-user-1')).not.toBeInTheDocument();

    expect(screen.getByTestId('btn-edit-user-2')).toBeInTheDocument();
    expect(screen.getByTestId('btn-delete-user-2')).toBeInTheDocument();
  });

  it('opens DeleteUserModal and deletes user', async () => {
    (api.getUsers as any)
      .mockResolvedValueOnce(mockUsers)
      .mockResolvedValueOnce(mockUsers.filter((u) => u.id !== 2));
    (api.deleteUser as any).mockResolvedValueOnce({ success: true, message: 'Usuário excluído' });

    render(<UsersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('user-row-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-delete-user-2'));
    expect(screen.getByTestId('delete-user-modal-dialog')).toBeInTheDocument();
    expect(screen.getByText('"Editor Junior"')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-confirm-delete-user'));

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith(2);
    });
  });

  it('switches to "Convites Gerados" subtab and displays metrics, filters, and list of invites', async () => {
    (api.getUsers as any).mockResolvedValueOnce(mockUsers);
    (api.getInvitations as any).mockResolvedValue(mockInvitations);

    render(<UsersManagement />);

    // Clica na subaba de Convites Gerados
    const invitationsSubTab = screen.getByTestId('subtab-invitations');
    fireEvent.click(invitationsSubTab);

    await waitFor(() => {
      expect(screen.getByTestId('invitations-list-view')).toBeInTheDocument();
      expect(api.getInvitations).toHaveBeenCalledTimes(1);
    });

    // Métricas de convites
    expect(screen.getByTestId('metric-invites-total')).toHaveTextContent('3');
    expect(screen.getByTestId('metric-invites-pending')).toHaveTextContent('1');
    expect(screen.getByTestId('metric-invites-used')).toHaveTextContent('1');
    expect(screen.getByTestId('metric-invites-expired')).toHaveTextContent('1');

    // Badges de status dos convites
    expect(screen.getByTestId('badge-status-pending-101')).toHaveTextContent('Falta Expirar (Ativo)');
    expect(screen.getByTestId('badge-status-used-102')).toHaveTextContent('Utilizado');
    expect(screen.getByText('membro_usado@multipost.com')).toBeInTheDocument();
    expect(screen.getByTestId('badge-status-expired-103')).toHaveTextContent('Expirado');
  });

  it('filters invitations by status pills and searches by keyword', async () => {
    (api.getUsers as any).mockResolvedValueOnce([]);
    (api.getInvitations as any).mockResolvedValue(mockInvitations);

    render(<UsersManagement />);

    fireEvent.click(screen.getByTestId('subtab-invitations'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-row-101')).toBeInTheDocument();
      expect(screen.getByTestId('invite-row-102')).toBeInTheDocument();
      expect(screen.getByTestId('invite-row-103')).toBeInTheDocument();
    });

    // Filtra apenas Faltam Expirar
    fireEvent.click(screen.getByTestId('filter-invites-pending'));
    expect(screen.getByTestId('invite-row-101')).toBeInTheDocument();
    expect(screen.queryByTestId('invite-row-102')).not.toBeInTheDocument();
    expect(screen.queryByTestId('invite-row-103')).not.toBeInTheDocument();

    // Filtra apenas Utilizados
    fireEvent.click(screen.getByTestId('filter-invites-used'));
    expect(screen.queryByTestId('invite-row-101')).not.toBeInTheDocument();
    expect(screen.getByTestId('invite-row-102')).toBeInTheDocument();

    // Filtra apenas Expirados
    fireEvent.click(screen.getByTestId('filter-invites-expired'));
    expect(screen.queryByTestId('invite-row-102')).not.toBeInTheDocument();
    expect(screen.getByTestId('invite-row-103')).toBeInTheDocument();

    // Retorna para todos e pesquisa por email
    fireEvent.click(screen.getByTestId('filter-invites-all'));
    const searchInput = screen.getByTestId('input-search-invites');
    fireEvent.change(searchInput, { target: { value: 'membro_usado' } });
    expect(screen.getByTestId('invite-row-102')).toBeInTheDocument();
    expect(screen.queryByTestId('invite-row-101')).not.toBeInTheDocument();
  });

  it('copies invitation link and allows revoking an invitation with confirmation modal', async () => {
    (api.getUsers as any).mockResolvedValueOnce([]);
    (api.getInvitations as any)
      .mockResolvedValueOnce(mockInvitations)
      .mockResolvedValueOnce(mockInvitations.filter((i) => i.id !== 101));
    (api.deleteInvitation as any).mockResolvedValueOnce({ success: true, message: 'Convite revogado' });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<UsersManagement />);

    fireEvent.click(screen.getByTestId('subtab-invitations'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-row-101')).toBeInTheDocument();
    });

    // Copia link
    fireEvent.click(screen.getByTestId('btn-copy-invite-101'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:3005/cadastro?token=token_ativo_pendente_123'
    );

    // Clica em revogar/excluir convite
    fireEvent.click(screen.getByTestId('btn-action-delete-101'));

    // Modal de confirmação aberto
    expect(screen.getByTestId('delete-invite-modal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Revogar Link de Convite?')).toBeInTheDocument();

    // Confirma exclusão
    fireEvent.click(screen.getByTestId('btn-confirm-delete-invite'));

    await waitFor(() => {
      expect(api.deleteInvitation).toHaveBeenCalledWith(101);
    });
  });

  it('triggers send reset password email from table action button', async () => {
    (api.getUsers as any).mockResolvedValueOnce(mockUsers);
    (api.sendUserPasswordReset as any).mockResolvedValueOnce({
      message: 'Link de redefinição enviado para junior@multipost.com',
      reset_url: 'http://localhost:3005/redefinir-senha?token=tok-test-123',
    });

    render(<UsersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-reset-password-2')).toBeInTheDocument();
    });

    // Super admin não tem botão de reset
    expect(screen.queryByTestId('btn-reset-password-1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-reset-password-2'));

    await waitFor(() => {
      expect(api.sendUserPasswordReset).toHaveBeenCalledWith(2);
      expect(
        screen.getByText('Link de redefinição enviado para junior@multipost.com')
      ).toBeInTheDocument();
    });
  });

  it('renders pagination component for users list', async () => {
    (api.getUsers as any).mockResolvedValue(mockUsers);

    render(<UsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
    });

    expect(screen.getByTestId('users-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toBeInTheDocument();
  });
});
