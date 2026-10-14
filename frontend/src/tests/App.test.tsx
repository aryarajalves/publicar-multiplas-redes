import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getPosts: vi.fn(),
    getPlatformOverview: vi.fn(),
    getVideoUrl: vi.fn((path) => `http://localhost:8000/${path}`),
    createPost: vi.fn(),
    publishNow: vi.fn(),
    deletePost: vi.fn(),
    getConnectedAccounts: vi.fn().mockResolvedValue({
      tiktok: { connected: false },
      youtube: { connected: true },
      instagram: { connected: false },
    }),
    getTikTokLoginUrl: vi.fn().mockResolvedValue({ url: 'https://test', state: '123' }),
    disconnectTikTok: vi.fn().mockResolvedValue({ success: true, message: 'Ok' }),
    getUsers: vi.fn().mockResolvedValue([]),
    createInvitation: vi.fn().mockResolvedValue({ id: 1, token: 'mock-tok', role: 'editor', expires_at: '2026-10-15T00:00:00Z', is_used: false }),
    validateInvitation: vi.fn().mockResolvedValue({ valid: true, role: 'editor', expires_at: '2026-10-15T00:00:00Z', message: 'Ok' }),
    registerByInvite: vi.fn().mockResolvedValue({ id: 2, name: 'Convidado', email: 'convidado@test.com', role: 'editor' }),
    login: vi.fn().mockResolvedValue({
      access_token: 'fake-token',
      token_type: 'bearer',
      user: { id: 1, name: 'Admin MultiPost', email: 'admin@multipost.com', role: 'admin' },
    }),
    logout: vi.fn().mockResolvedValue({ success: true, message: 'Logout realizado com sucesso' }),
    getMonitoredContainers: vi.fn().mockResolvedValue([]),
    getContainerLogs: vi.fn().mockResolvedValue({ container: 'backend', total_lines: 0, entries: [] }),
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    localStorage.clear();
    localStorage.setItem(
      'multipost_user',
      JSON.stringify({ id: 1, name: 'Admin MultiPost', email: 'admin@multipost.com', role: 'admin' })
    );
    window.scrollTo = vi.fn();
  });

  it('renders navbar and loads overview and posts', async () => {
    (api.getPosts as any).mockResolvedValueOnce({
      total: 1,
      items: [
        {
          id: 10,
          title: 'Primeiro Post Automatizado',
          caption: 'Legenda do post',
          video_filename: 'v.mp4',
          video_path: 'uploads/v.mp4',
          status: 'scheduled',
          scheduled_at: '2026-10-10T12:00:00Z',
          created_at: '2026-10-09T10:00:00Z',
          updated_at: '2026-10-09T10:00:00Z',
          publications: [
            {
              id: 1,
              post_id: 10,
              platform: 'instagram',
              status: 'pending',
              retry_count: 0,
              created_at: '2026-10-09T10:00:00Z',
              updated_at: '2026-10-09T10:00:00Z',
            },
          ],
        },
      ],
    });

    (api.getPlatformOverview as any).mockResolvedValueOnce({
      total_posts: 1,
      total_scheduled: 1,
      total_published: 0,
      total_failed: 0,
      platforms: [
        { platform: 'instagram', configured: true, total_published: 0, total_pending: 1, total_failed: 0 },
        { platform: 'youtube', configured: false, total_published: 0, total_pending: 0, total_failed: 0 },
        { platform: 'tiktok', configured: false, total_published: 0, total_pending: 0, total_failed: 0 },
      ],
    });

    render(<App />);

    expect(screen.getAllByText('MultiPost')[0]).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Primeiro Post Automatizado')).toBeInTheDocument();
    });
  });

  it('opens upload modal when "+ Agendar Novo Vídeo" is clicked', async () => {
    (api.getPosts as any).mockResolvedValueOnce({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValueOnce({
      total_posts: 0,
      total_scheduled: 0,
      total_published: 0,
      total_failed: 0,
      platforms: [],
    });

    render(<App />);

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(screen.getAllByText('MultiPost')[0]).toBeInTheDocument();
    });

    const openUploadBtn = screen.getByTestId('btn-open-upload');
    fireEvent.click(openUploadBtn);

    expect(screen.getByTestId('video-upload-modal')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when post delete button is clicked and deletes on confirm', async () => {
    (api.getPosts as any).mockResolvedValueOnce({
      total: 1,
      items: [
        {
          id: 77,
          title: 'Post Para Excluir',
          caption: 'Legenda',
          video_filename: 'v.mp4',
          video_path: 'uploads/v.mp4',
          status: 'published',
          scheduled_at: '2026-10-10T12:00:00Z',
          created_at: '2026-10-10T12:00:00Z',
          updated_at: '2026-10-10T12:00:00Z',
          publications: [],
        },
      ],
    });
    (api.getPlatformOverview as any).mockResolvedValue({
      total_posts: 1,
      total_scheduled: 0,
      total_published: 1,
      total_failed: 0,
      platforms: [],
    });
    (api.deletePost as any).mockResolvedValueOnce({ success: true });
    (api.getPosts as any).mockResolvedValue({ total: 0, items: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Post Para Excluir')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('btn-delete-77');
    fireEvent.click(deleteBtn);

    // Modal de exclusão aparece
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('delete-modal-post-title')).toHaveTextContent('Post Para Excluir');

    // Clica no botão de confirmar exclusão
    const confirmBtn = screen.getByTestId('btn-confirm-delete');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.deletePost).toHaveBeenCalledWith(77);
      expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
    });
  });

  it('fetches posts with limit 20 and skip 0, and updates page when pagination buttons are clicked', async () => {
    (api.getPosts as any).mockResolvedValueOnce({
      total: 35,
      items: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Vídeo ${i + 1}`,
        caption: `Legenda ${i + 1}`,
        video_filename: `video_${i + 1}.mp4`,
        video_path: `uploads/video_${i + 1}.mp4`,
        status: 'published',
        scheduled_at: '2026-10-10T12:00:00Z',
        created_at: '2026-10-10T12:00:00Z',
        updated_at: '2026-10-10T12:00:00Z',
        publications: [],
      })),
    });
    (api.getPlatformOverview as any).mockResolvedValue({
      total_posts: 35,
      total_scheduled: 0,
      total_published: 35,
      total_failed: 0,
      platforms: [],
    });

    render(<App />);

    await waitFor(() => {
      expect(api.getPosts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, skip: 0 })
      );
      expect(screen.getByTestId('posts-pagination')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-info')).toHaveTextContent(/Exibindo 1 a 20 de 35 vídeos/i);
    });

    // Mock segunda página
    (api.getPosts as any).mockResolvedValueOnce({
      total: 35,
      items: Array.from({ length: 15 }, (_, i) => ({
        id: i + 21,
        title: `Vídeo ${i + 21}`,
        caption: `Legenda ${i + 21}`,
        video_filename: `video_${i + 21}.mp4`,
        video_path: `uploads/video_${i + 21}.mp4`,
        status: 'published',
        scheduled_at: '2026-10-10T12:00:00Z',
        created_at: '2026-10-10T12:00:00Z',
        updated_at: '2026-10-10T12:00:00Z',
        publications: [],
      })),
    });

    // Clica no botão Próxima
    const nextBtn = screen.getByTestId('pagination-next');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(api.getPosts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, skip: 20 })
      );
    });
  });

  it('opens ConnectedAccountsModal when "Contas" button in navbar is clicked', async () => {
    (api.getPosts as any).mockResolvedValueOnce({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValueOnce({
      total_posts: 0,
      total_scheduled: 0,
      total_published: 0,
      total_failed: 0,
      platforms: [],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('MultiPost')[0]).toBeInTheDocument();
    });

    const accountsBtn = screen.getByTestId('btn-open-accounts');
    fireEvent.click(accountsBtn);

    expect(screen.getByTestId('connected-accounts-modal')).toBeInTheDocument();
  });

  it('opens Terms of Service and Privacy Policy modals from footer links', async () => {
    (api.getPosts as any).mockResolvedValueOnce({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValueOnce({
      total_posts: 0,
      total_scheduled: 0,
      total_published: 0,
      total_failed: 0,
      platforms: [],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('MultiPost')[0]).toBeInTheDocument();
    });

    // Verifica links de Termos de Uso e Política de Privacidade no Footer com slugs dedicados
    const termsLink = screen.getByTestId('link-terms-footer');
    expect(termsLink).toHaveAttribute('href', '/termosdeuso');
    expect(termsLink).toHaveAttribute('target', '_blank');

    const privacyLink = screen.getByTestId('link-privacy-footer');
    expect(privacyLink).toHaveAttribute('href', '/politicaprivacidade');
    expect(privacyLink).toHaveAttribute('target', '_blank');
  });

  it('renders standalone PrivacyPolicyPage directly when slug is /politicaprivacidade', () => {
    // Simula URL /politicaprivacidade
    window.history.pushState({}, '', '/politicaprivacidade');

    render(<App />);

    expect(screen.getByTestId('privacy-policy-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();

    // Limpa a URL de volta para /
    window.history.pushState({}, '', '/');
  });

  it('renders standalone TermsOfServicePage directly when slug is /termosdeuso', () => {
    // Simula URL /termosdeuso
    window.history.pushState({}, '', '/termosdeuso');

    render(<App />);

    expect(screen.getByTestId('terms-of-service-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Termos de Uso da Plataforma' })).toBeInTheDocument();

    // Limpa a URL de volta para /
    window.history.pushState({}, '', '/');
  });

  it('switches between Publicações and Gestão de Usuários tabs using the Sidebar', async () => {
    (api.getPosts as any).mockResolvedValue({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValue({
      total_posts: 0,
      total_scheduled: 0,
      total_published: 0,
      total_failed: 0,
      platforms: [],
    });
    (api.getUsers as any).mockResolvedValue([
      {
        id: 1,
        name: 'Usuário Admin',
        email: 'admin@multipost.com',
        role: 'admin',
        is_active: true,
        created_at: '2026-10-10T10:00:00Z',
        updated_at: '2026-10-10T10:00:00Z',
      },
    ]);

    render(<App />);

    // Verifica que a sidebar está presente
    expect(screen.getByTestId('main-sidebar')).toBeInTheDocument();
    // Na aba de publicações, a Navbar e o botão de agendamento estão visíveis
    expect(screen.getByTestId('btn-open-upload')).toBeInTheDocument();

    // Clica em "Gestão de Usuários"
    fireEvent.click(screen.getByTestId('sidebar-btn-users'));

    // Agora a tela de gestão de usuários deve estar visível e a Navbar oculta
    await waitFor(() => {
      expect(screen.getByTestId('users-management-view')).toBeInTheDocument();
      expect(screen.getByText('Usuário Admin')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-open-upload')).not.toBeInTheDocument();
    });

    // Clica de volta em "Publicações"
    fireEvent.click(screen.getByTestId('sidebar-btn-posts'));

    // A tela de gestão de usuários não deve mais estar visível e a Navbar volta a ser exibida
    await waitFor(() => {
      expect(screen.queryByTestId('users-management-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('btn-open-upload')).toBeInTheDocument();
    });
  });

  it('renders LoginPage when user is not authenticated and logs in successfully', async () => {
    localStorage.removeItem('multipost_user');
    (api.getPosts as any).mockResolvedValue({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValue({ total_posts: 0, total_scheduled: 0, total_published: 0, total_failed: 0, platforms: [] });

    render(<App />);

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByText('Acessar Plataforma')).toBeInTheDocument();

    // Preenche credenciais e clica em login
    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'admin@multipost.com' } });
    fireEvent.change(screen.getByTestId('input-login-password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByTestId('btn-submit-login'));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({ email: 'admin@multipost.com', password: 'admin123' });
      expect(screen.getByTestId('main-sidebar')).toBeInTheDocument();
    });
  });

  it('opens logout confirmation modal and confirms logout', async () => {
    (api.getPosts as any).mockResolvedValue({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValue({ total_posts: 0, total_scheduled: 0, total_published: 0, total_failed: 0, platforms: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('main-sidebar')).toBeInTheDocument();
    });

    // Clica no botão de logout na sidebar
    fireEvent.click(screen.getByTestId('sidebar-btn-logout'));

    // Modal de confirmação de logout aparece
    expect(screen.getByTestId('logout-modal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Encerrar Sessão?')).toBeInTheDocument();

    // Confirma saída
    fireEvent.click(screen.getByTestId('btn-confirm-logout'));

    await waitFor(() => {
      expect(api.logout).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders RegisterPage on /cadastro route even when not logged in', async () => {
    localStorage.clear();
    window.history.pushState({}, '', '/cadastro?token=mock-tok');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('register-page-view')).toBeInTheDocument();
    });

    window.history.pushState({}, '', '/');
  });

  it('switches to Gestão de Logs tab when clicked in sidebar and hides navbar banner', async () => {
    (api.getPosts as any).mockResolvedValueOnce({ total: 0, items: [] });
    (api.getPlatformOverview as any).mockResolvedValueOnce({
      total_posts: 0,
      total_scheduled: 0,
      total_published: 0,
      total_failed: 0,
      platforms: [],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('main-sidebar')).toBeInTheDocument();
    });

    // Clica no botão Gestão de Logs
    fireEvent.click(screen.getByTestId('sidebar-btn-logs'));

    await waitFor(() => {
      expect(screen.getByTestId('logs-management-page')).toBeInTheDocument();
      // O banner superior de postagens fica oculto
      expect(screen.queryByTestId('btn-open-upload-navbar')).not.toBeInTheDocument();
    });
  });
});


