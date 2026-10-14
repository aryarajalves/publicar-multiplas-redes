import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteUserModal } from '../components/DeleteUserModal';
import { User } from '../types';

describe('DeleteUserModal Component', () => {
  const mockUser: User = {
    id: 12,
    name: 'Carlos Exclusão',
    email: 'carlos@multipost.com',
    role: 'editor',
    is_active: true,
    created_at: '2026-10-10T10:00:00Z',
    updated_at: '2026-10-10T10:00:00Z',
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DeleteUserModal
        isOpen={false}
        user={mockUser}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders confirmation dialog with user details', () => {
    render(
      <DeleteUserModal
        isOpen={true}
        user={mockUser}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={false}
      />
    );

    expect(screen.getByText('Excluir Usuário?')).toBeInTheDocument();
    expect(screen.getByText('"Carlos Exclusão"')).toBeInTheDocument();
    expect(screen.getByText('carlos@multipost.com')).toBeInTheDocument();
  });

  it('triggers onConfirm when confirmation button is clicked', () => {
    const onConfirm = vi.fn();

    render(
      <DeleteUserModal
        isOpen={true}
        user={mockUser}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
      />
    );

    fireEvent.click(screen.getByTestId('btn-confirm-delete-user'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when cancel button or close X is clicked', () => {
    const onClose = vi.fn();

    render(
      <DeleteUserModal
        isOpen={true}
        user={mockUser}
        onClose={onClose}
        onConfirm={vi.fn()}
        isDeleting={false}
      />
    );

    fireEvent.click(screen.getByTestId('btn-close-delete-user'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-cancel-delete-user'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('displays error message when error prop is provided', () => {
    render(
      <DeleteUserModal
        isOpen={true}
        user={mockUser}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={false}
        error="Não é permitido excluir o único usuário do sistema."
      />
    );

    expect(
      screen.getByText('Não é permitido excluir o único usuário do sistema.')
    ).toBeInTheDocument();
  });
});
