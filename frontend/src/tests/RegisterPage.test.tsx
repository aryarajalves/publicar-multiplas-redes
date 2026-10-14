import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterPage } from '../pages/RegisterPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    validateInvitation: vi.fn(),
    registerByInvite: vi.fn(),
    sendVerificationCode: vi.fn(),
  },
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state when token is missing from URL', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });

    const onGoToLogin = vi.fn();
    render(<RegisterPage onGoToLogin={onGoToLogin} />);

    await waitFor(() => {
      expect(screen.getByTestId('token-error-state')).toBeInTheDocument();
      expect(screen.getByText('Convite Não Disponível')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-error-go-to-login'));
    expect(onGoToLogin).toHaveBeenCalledTimes(1);
  });

  it('renders error state when API reports invalid or expired token', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_invalido_123' },
      writable: true,
    });

    (api.validateInvitation as any).mockRejectedValueOnce({
      response: { data: { detail: 'Este link de convite expirou.' } },
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('token-error-state')).toBeInTheDocument();
      expect(screen.getByText('Este link de convite expirou.')).toBeInTheDocument();
    });
  });

  it('renders register form without a separate "Validar E-mail" button when token is valid', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_valido_xyz' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'editor',
      expires_at: '2026-10-15T12:00:00Z',
      message: 'Convite válido',
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-whatsapp')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-password')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-confirm-password')).toBeInTheDocument();
      expect(screen.getByTestId('btn-submit-register')).toHaveTextContent('Criar Conta');
    });

    // O botão isolado "Validar E-mail" NÃO deve existir mais
    expect(screen.queryByTestId('btn-send-verification-code')).not.toBeInTheDocument();

    // Requisitos de senha visíveis
    expect(screen.getByText('Mínimo de 12 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Pelo menos 1 letra maiúscula (A-Z)')).toBeInTheDocument();
    expect(screen.getByText('Pelo menos 1 letra minúscula (a-z)')).toBeInTheDocument();
    expect(screen.getByText('Pelo menos 1 número (0-9)')).toBeInTheDocument();
    expect(screen.getByText('Pelo menos 1 caractere especial (!@#$...)')).toBeInTheDocument();
  });

  it('executes two-step flow: Criar Conta transitions to OTP panel and confirming OTP registers user', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_valido_xyz' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'admin',
      expires_at: '2026-10-15T12:00:00Z',
    });

    (api.sendVerificationCode as any).mockResolvedValueOnce({
      success: true,
      message: 'Código enviado com sucesso para seu e-mail!',
      email: 'membro@multipost.com',
    });

    (api.registerByInvite as any).mockResolvedValueOnce({
      id: 5,
      name: 'Novo Membro',
      email: 'membro@multipost.com',
      whatsapp: '11988887777',
      role: 'admin',
      is_active: true,
    });

    const onGoToLogin = vi.fn();
    render(<RegisterPage onGoToLogin={onGoToLogin} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
    });

    // Preenche dados básicos
    fireEvent.change(screen.getByTestId('input-register-name'), { target: { value: 'Novo Membro' } });
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'membro@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-register-whatsapp'), { target: { value: '11988887777' } });

    // Senha fraca -> botão Criar Conta desabilitado
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'fraca' } });
    fireEvent.change(screen.getByTestId('input-register-confirm-password'), { target: { value: 'fraca' } });
    expect(screen.getByTestId('btn-submit-register')).toBeDisabled();

    // Senha forte que cumpre os 5 critérios
    const strongPassword = 'SenhaForte@2026';
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: strongPassword } });
    fireEvent.change(screen.getByTestId('input-register-confirm-password'), { target: { value: strongPassword } });

    // Botão Criar Conta agora habilitado
    const submitBtn = screen.getByTestId('btn-submit-register');
    expect(submitBtn).not.toBeDisabled();

    // Clica em Criar Conta -> deve enviar código e transicionar para o painel de verificação
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.sendVerificationCode).toHaveBeenCalledWith('token_valido_xyz', 'membro@multipost.com');
      expect(screen.getByTestId('register-otp-panel')).toBeInTheDocument();
      expect(screen.getByTestId('otp-target-email')).toHaveTextContent('membro@multipost.com');
      expect(screen.getByTestId('input-register-code')).toBeInTheDocument();
    });

    // Botão de confirmar no Painel 2 desabilitado sem os 6 dígitos
    expect(screen.getByTestId('btn-confirm-code-register')).toBeDisabled();

    // Digita os 6 dígitos
    fireEvent.change(screen.getByTestId('input-register-code'), { target: { value: '654321' } });
    expect(screen.getByTestId('btn-confirm-code-register')).not.toBeDisabled();

    // Confirma código
    fireEvent.click(screen.getByTestId('btn-confirm-code-register'));

    await waitFor(() => {
      expect(api.registerByInvite).toHaveBeenCalledWith('token_valido_xyz', {
        name: 'Novo Membro',
        email: 'membro@multipost.com',
        whatsapp: '+55 (11) 98888-7777',
        password: strongPassword,
        verification_code: '654321',
      });
      expect(screen.getByTestId('register-success-state')).toBeInTheDocument();
      expect(screen.getByText('Conta Criada com Sucesso!')).toBeInTheDocument();
    });

    // Clica para acessar login
    fireEvent.click(screen.getByTestId('btn-success-go-to-login'));
    expect(onGoToLogin).toHaveBeenCalledTimes(1);
  });

  it('displays error and stays on step 1 when email is already registered', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_valido_xyz' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'editor',
      expires_at: '2026-10-15T12:00:00Z',
    });

    (api.sendVerificationCode as any).mockRejectedValueOnce({
      response: { data: { detail: 'Já existe uma conta cadastrada com este endereço de e-mail.' } },
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-register-name'), { target: { value: 'Admin Test' } });
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'admin@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-register-whatsapp'), { target: { value: '11988887777' } });
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'SenhaForte@2026' } });
    fireEvent.change(screen.getByTestId('input-register-confirm-password'), { target: { value: 'SenhaForte@2026' } });

    fireEvent.click(screen.getByTestId('btn-submit-register'));

    await waitFor(() => {
      expect(screen.getByTestId('register-form-error')).toBeInTheDocument();
      expect(screen.getByText('Já existe uma conta cadastrada com este endereço de e-mail.')).toBeInTheDocument();
      // Não deve ter avançado para o painel de OTP
      expect(screen.queryByTestId('register-otp-panel')).not.toBeInTheDocument();
    });
  });

  it('allows user to go back from OTP step to step 1 to correct data', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_valido_xyz' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'editor',
      expires_at: '2026-10-15T12:00:00Z',
    });

    (api.sendVerificationCode as any).mockResolvedValueOnce({
      success: true,
      message: 'Código enviado!',
      email: 'teste@multipost.com',
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-register-name'), { target: { value: 'Nome Teste' } });
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'teste@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-register-whatsapp'), { target: { value: '11988887777' } });
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'SenhaForte@2026' } });
    fireEvent.change(screen.getByTestId('input-register-confirm-password'), { target: { value: 'SenhaForte@2026' } });

    fireEvent.click(screen.getByTestId('btn-submit-register'));

    await waitFor(() => {
      expect(screen.getByTestId('register-otp-panel')).toBeInTheDocument();
    });

    // Clica em "Corrigir Dados"
    fireEvent.click(screen.getByTestId('btn-back-to-step1'));

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-email')).toHaveValue('teste@multipost.com');
      expect(screen.queryByTestId('register-otp-panel')).not.toBeInTheDocument();
    });
  });

  it('displays warning banner when Brevo email service is not configured in invitation validation', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_sem_brevo' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'admin',
      expires_at: '2026-10-15T12:00:00Z',
      email_service_configured: false,
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('brevo-not-configured-warning')).toBeInTheDocument();
      expect(screen.getByText(/O serviço Brevo não está conectado/i)).toBeInTheDocument();
    });
  });

  it('displays error explanation when Brevo fails to dispatch OTP during registration submission', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_valido_xyz' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'editor',
      expires_at: '2026-10-15T12:00:00Z',
      email_service_configured: false,
    });

    const errorReason = "O serviço de e-mail (Brevo) não está conectado. A chave 'BREVO_API_KEY' não foi configurada no arquivo .env do servidor.";
    (api.sendVerificationCode as any).mockRejectedValueOnce({
      response: { data: { detail: errorReason } },
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-register-name'), { target: { value: 'João Silva' } });
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'joao@exemplo.com' } });
    fireEvent.change(screen.getByTestId('input-register-whatsapp'), { target: { value: '11999998888' } });
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'SenhaForte@2026' } });
    fireEvent.change(screen.getByTestId('input-register-confirm-password'), { target: { value: 'SenhaForte@2026' } });

    fireEvent.click(screen.getByTestId('btn-submit-register'));

    await waitFor(() => {
      expect(screen.getByTestId('register-form-error')).toBeInTheDocument();
      expect(screen.getByText(errorReason)).toBeInTheDocument();
      expect(screen.queryByTestId('register-otp-panel')).not.toBeInTheDocument();
    });
  });

  it('allows selecting another country DDI and registers with that country code', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=token_valido_xyz' },
      writable: true,
    });

    (api.validateInvitation as any).mockResolvedValueOnce({
      valid: true,
      role: 'editor',
      expires_at: '2026-10-15T12:00:00Z',
    });

    (api.sendVerificationCode as any).mockResolvedValueOnce({
      success: true,
      message: 'Código enviado!',
      email: 'portugal@multipost.com',
    });

    (api.registerByInvite as any).mockResolvedValueOnce({
      id: 8,
      name: 'Manuel Silva',
      email: 'portugal@multipost.com',
      whatsapp: '+351 912 345 678',
      role: 'editor',
      is_active: true,
    });

    render(<RegisterPage onGoToLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('input-register-name')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-register-name'), { target: { value: 'Manuel Silva' } });
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'portugal@multipost.com' } });

    // Abre o dropdown de DDI e seleciona Portugal
    fireEvent.click(screen.getByTestId('dropdown-ddi-trigger'));
    fireEvent.click(screen.getByTestId('ddi-option-pt'));
    expect(screen.getByTestId('dropdown-ddi-trigger')).toHaveTextContent('+351');

    fireEvent.change(screen.getByTestId('input-register-whatsapp'), { target: { value: '912 345 678' } });
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'SenhaForte@2026' } });
    fireEvent.change(screen.getByTestId('input-register-confirm-password'), { target: { value: 'SenhaForte@2026' } });

    fireEvent.click(screen.getByTestId('btn-submit-register'));

    await waitFor(() => {
      expect(screen.getByTestId('register-otp-panel')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-register-code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('btn-confirm-code-register'));

    await waitFor(() => {
      expect(api.registerByInvite).toHaveBeenCalledWith('token_valido_xyz', expect.objectContaining({
        whatsapp: '+351 912 345 678',
      }));
    });
  });
});


