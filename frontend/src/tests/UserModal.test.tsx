import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserModal } from '../components/UserModal';
import { api } from '../services/api';
import { User } from '../types';

vi.mock('../services/api', () => ({
  api: {
    createUser: vi.fn(),
    updateUser: vi.fn(),
    sendUserPasswordReset: vi.fn(),
  },
}));

describe('UserModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in create mode with empty fields', () => {
    render(
      <UserModal
        isOpen={true}
        userToEdit={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    expect(screen.getByTestId('input-user-name')).toHaveValue('');
    expect(screen.getByTestId('input-user-email')).toHaveValue('');
    expect(screen.getByTestId('input-user-password')).toHaveValue('');
    expect(screen.getByTestId('btn-submit-user')).toHaveTextContent('Criar Usuário');
  });

  it('validates minimum password length in create mode', async () => {
    render(
      <UserModal
        isOpen={true}
        userToEdit={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('input-user-name'), { target: { value: 'Carlos Admin' } });
    fireEvent.change(screen.getByTestId('input-user-email'), { target: { value: 'carlos@test.com' } });
    fireEvent.change(screen.getByTestId('input-user-password'), { target: { value: '123' } });

    fireEvent.click(screen.getByTestId('btn-submit-user'));

    await waitFor(() => {
      expect(screen.getByText('A senha deve conter no mínimo 6 caracteres.')).toBeInTheDocument();
    });
    expect(api.createUser).not.toHaveBeenCalled();
  });

  it('creates user successfully and triggers onSuccess', async () => {
    const mockCreatedUser: User = {
      id: 101,
      name: 'Maria Silva',
      email: 'maria@multipost.com',
      role: 'admin',
      is_active: true,
      created_at: '2026-10-10T10:00:00Z',
      updated_at: '2026-10-10T10:00:00Z',
    };
    (api.createUser as any).mockResolvedValueOnce(mockCreatedUser);
    const onSuccess = vi.fn();

    render(
      <UserModal
        isOpen={true}
        userToEdit={null}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('input-user-name'), { target: { value: 'Maria Silva' } });
    fireEvent.change(screen.getByTestId('input-user-email'), { target: { value: 'maria@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-user-password'), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByTestId('btn-role-admin'));

    fireEvent.click(screen.getByTestId('btn-submit-user'));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({
        name: 'Maria Silva',
        email: 'maria@multipost.com',
        password: 'senha123',
        role: 'admin',
        is_active: true,
      });
      expect(onSuccess).toHaveBeenCalledWith(mockCreatedUser);
    });
  });

  it('pre-fills fields in edit mode and updates user successfully', async () => {
    const existingUser: User = {
      id: 55,
      name: 'Editor João',
      email: 'joao@multipost.com',
      role: 'editor',
      is_active: true,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    };
    const updatedUser: User = {
      ...existingUser,
      name: 'João Atualizado',
      role: 'admin',
    };
    (api.updateUser as any).mockResolvedValueOnce(updatedUser);
    const onSuccess = vi.fn();

    render(
      <UserModal
        isOpen={true}
        userToEdit={existingUser}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
    expect(screen.getByTestId('input-user-name')).toHaveValue('Editor João');
    expect(screen.getByTestId('input-user-email')).toHaveValue('joao@multipost.com');

    // Altera nome e função
    fireEvent.change(screen.getByTestId('input-user-name'), { target: { value: 'João Atualizado' } });
    fireEvent.click(screen.getByTestId('btn-role-admin'));

    fireEvent.click(screen.getByTestId('btn-submit-user'));

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith(55, {
        name: 'João Atualizado',
        email: 'joao@multipost.com',
        role: 'admin',
        is_active: true,
      });
      expect(onSuccess).toHaveBeenCalledWith(updatedUser);
    });
  });

  it('calls onClose when close or cancel button is clicked', () => {
    const onClose = vi.fn();

    render(
      <UserModal
        isOpen={true}
        userToEdit={null}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('user-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-cancel-user-modal'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(
      <UserModal
        isOpen={true}
        userToEdit={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const passwordInput = screen.getByTestId('input-user-password');
    const toggleButton = screen.getByTestId('btn-toggle-password-visibility');

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('triggers send reset password email in edit mode and displays success message', async () => {
    const existingUser: User = {
      id: 88,
      name: 'Paula Lima',
      email: 'paula@multipost.com',
      role: 'editor',
      is_active: true,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    };
    (api.sendUserPasswordReset as any).mockResolvedValueOnce({
      message: 'Link de redefinição de senha enviado com sucesso por e-mail.',
      reset_url: 'http://localhost:3005/redefinir-senha?token=tok-abc-123',
    });

    render(
      <UserModal
        isOpen={true}
        userToEdit={existingUser}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const sendResetBtn = screen.getByTestId('btn-modal-send-reset-password');
    expect(sendResetBtn).toBeInTheDocument();
    fireEvent.click(sendResetBtn);

    await waitFor(() => {
      expect(api.sendUserPasswordReset).toHaveBeenCalledWith(88);
      expect(screen.getByTestId('msg-reset-password-sent')).toBeInTheDocument();
      expect(
        screen.getByText('Link de redefinição de senha enviado com sucesso por e-mail.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('http://localhost:3005/redefinir-senha?token=tok-abc-123')
      ).toBeInTheDocument();
    });
  });
});
