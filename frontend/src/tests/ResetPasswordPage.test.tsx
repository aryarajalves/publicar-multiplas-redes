import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    validateResetPasswordToken: vi.fn(),
    confirmResetPassword: vi.fn(),
  },
}));

describe('ResetPasswordPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = {
      search: '',
      origin: 'http://localhost:7300',
    };
  });

  it('displays error if token is missing from URL query params', async () => {
    window.location.search = '';
    const onGoToLogin = vi.fn();

    render(<ResetPasswordPage onGoToLogin={onGoToLogin} />);

    expect(screen.getByTestId('reset-token-error')).toBeInTheDocument();
    expect(screen.getByText('Link de redefinição inválido ou ausente na URL.')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-error-go-to-login'));
    expect(onGoToLogin).toHaveBeenCalledTimes(1);
  });

  it('displays error if token validation fails on backend', async () => {
    window.location.search = '?token=invalid_tok';
    (api.validateResetPasswordToken as any).mockRejectedValueOnce({
      response: { data: { detail: 'Token de redefinição expirado ou já utilizado.' } },
    });

    render(<ResetPasswordPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(api.validateResetPasswordToken).toHaveBeenCalledWith('invalid_tok');
      expect(screen.getByTestId('reset-token-error')).toBeInTheDocument();
      expect(screen.getByText('Token de redefinição expirado ou já utilizado.')).toBeInTheDocument();
    });
  });

  it('renders form with user email and validates password criteria', async () => {
    window.location.search = '?token=valid_tok_123';
    (api.validateResetPasswordToken as any).mockResolvedValueOnce({
      valid: true,
      user_id: 10,
      email: 'usuario@multipost.com',
      expires_at: '2026-10-15T10:00:00Z',
    });

    render(<ResetPasswordPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/usuario@multipost.com/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId('btn-submit-reset-password');
    expect(submitBtn).toBeDisabled();

    // Digita senha fraca
    const passInput = screen.getByTestId('input-reset-password');
    const confirmInput = screen.getByTestId('input-reset-confirm-password');

    fireEvent.change(passInput, { target: { value: 'fraca' } });
    fireEvent.change(confirmInput, { target: { value: 'fraca' } });
    expect(submitBtn).toBeDisabled();

    // Digita senha forte (12 chars, maiusc, minusc, num, esp)
    fireEvent.change(passInput, { target: { value: 'MinhaSenhaForte@2026' } });
    fireEvent.change(confirmInput, { target: { value: 'MinhaSenhaForte@2026' } });

    expect(submitBtn).not.toBeDisabled();
  });

  it('toggles password visibility with eye icons', async () => {
    window.location.search = '?token=valid_tok_123';
    (api.validateResetPasswordToken as any).mockResolvedValueOnce({
      valid: true,
      user_id: 10,
      email: 'usuario@multipost.com',
      expires_at: '2026-10-15T10:00:00Z',
    });

    render(<ResetPasswordPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-reset-password')).toBeInTheDocument();
    });

    const passInput = screen.getByTestId('input-reset-password');
    const togglePass = screen.getByTestId('btn-toggle-reset-password');

    expect(passInput).toHaveAttribute('type', 'password');
    fireEvent.click(togglePass);
    expect(passInput).toHaveAttribute('type', 'text');

    const confirmInput = screen.getByTestId('input-reset-confirm-password');
    const toggleConfirm = screen.getByTestId('btn-toggle-reset-confirm-password');

    expect(confirmInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleConfirm);
    expect(confirmInput).toHaveAttribute('type', 'text');
  });

  it('submits new password successfully and displays success card', async () => {
    window.location.search = '?token=valid_tok_123';
    (api.validateResetPasswordToken as any).mockResolvedValueOnce({
      valid: true,
      user_id: 10,
      email: 'usuario@multipost.com',
      expires_at: '2026-10-15T10:00:00Z',
    });
    (api.confirmResetPassword as any).mockResolvedValueOnce({
      message: 'Senha redefinida com sucesso!',
    });
    const onGoToLogin = vi.fn();

    render(<ResetPasswordPage onGoToLogin={onGoToLogin} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-reset-password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-reset-password'), {
      target: { value: 'NovaSenhaForte@2026' },
    });
    fireEvent.change(screen.getByTestId('input-reset-confirm-password'), {
      target: { value: 'NovaSenhaForte@2026' },
    });

    fireEvent.click(screen.getByTestId('btn-submit-reset-password'));

    await waitFor(() => {
      expect(api.confirmResetPassword).toHaveBeenCalledWith(
        'valid_tok_123',
        'NovaSenhaForte@2026'
      );
      expect(screen.getByTestId('reset-success-card')).toBeInTheDocument();
      expect(screen.getByText('Senha Atualizada com Sucesso!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-success-go-to-login'));
    expect(onGoToLogin).toHaveBeenCalledTimes(1);
  });
});
