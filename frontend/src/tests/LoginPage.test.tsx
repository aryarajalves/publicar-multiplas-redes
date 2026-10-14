import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../pages/LoginPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
  },
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login page title, inputs and buttons', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByText('Acessar Plataforma')).toBeInTheDocument();
    expect(screen.getByTestId('input-login-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-login-password')).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit-login')).toBeInTheDocument();
    expect(screen.getByTestId('btn-fill-demo-credentials')).toBeInTheDocument();
  });

  it('toggles password visibility between password and text', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    const passwordInput = screen.getByTestId('input-login-password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByTitle('Exibir senha');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByTitle('Ocultar senha');
    fireEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('pre-fills demo credentials when clicking demo button', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    const demoBtn = screen.getByTestId('btn-fill-demo-credentials');
    fireEvent.click(demoBtn);

    const emailInput = screen.getByTestId('input-login-email') as HTMLInputElement;
    const passwordInput = screen.getByTestId('input-login-password') as HTMLInputElement;

    expect(emailInput.value).toBe('admin@multipost.com');
    expect(passwordInput.value).toBe('admin123');
  });

  it('shows error if email does not contain @', async () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByTestId('input-login-password'), { target: { value: 'admin123' } });
    const form = screen.getByTestId('btn-submit-login').closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByTestId('login-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Por favor, informe um endereço de e-mail válido/i)).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('submits login successfully and calls onLoginSuccess', async () => {
    const onLoginSuccess = vi.fn();
    const mockUser = {
      id: 1,
      name: 'Admin Master',
      email: 'admin@multipost.com',
      role: 'admin',
    };

    (api.login as any).mockResolvedValueOnce({
      access_token: 'fake-token-123',
      token_type: 'bearer',
      user: mockUser,
    });

    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'admin@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-login-password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByTestId('btn-submit-login'));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'admin@multipost.com',
        password: 'admin123',
      });
      expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('displays error message when login fails', async () => {
    (api.login as any).mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Credenciais de acesso incorretas.',
        },
      },
    });

    render(<LoginPage onLoginSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'wrong@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-login-password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByTestId('btn-submit-login'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Credenciais de acesso incorretas.')).toBeInTheDocument();
    });
  });
});
