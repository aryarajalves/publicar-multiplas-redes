import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getPlatformsProfiles: vi.fn(),
    getInstagramProfile: vi.fn(),
    getYoutubeProfile: vi.fn(),
    getTiktokProfile: vi.fn(),
  },
}));

describe('Navbar - Botão Unificado e Popover de Redes Sociais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título MultiPost, botão unificado de redes sociais e botões de ação na Navbar', async () => {
    (api.getPlatformsProfiles as any).mockResolvedValue({
      instagram: { connected: false, followers_count: 0 },
      youtube: { connected: false, subscriber_count: 0 },
      tiktok: { connected: false, follower_count: 0 },
    });

    const handleUpload = vi.fn();
    const handleRefresh = vi.fn();
    const handleAccounts = vi.fn();

    render(
      <Navbar
        onOpenUpload={handleUpload}
        onRefresh={handleRefresh}
        onOpenAccounts={handleAccounts}
      />
    );

    expect(screen.getByText('MultiPost')).toBeInTheDocument();
    expect(screen.getByTestId('btn-open-upload')).toBeInTheDocument();
    expect(screen.getByTestId('btn-open-accounts')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-social-summary-btn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('MultiPost')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-open-upload'));
    expect(handleUpload).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-open-accounts'));
    expect(handleAccounts).toHaveBeenCalledTimes(1);
  });

  it('ao clicar no botão unificado, exibe popover com nomes e contagem de seguidores de cada rede (Instagram, YouTube, TikTok)', async () => {
    (api.getPlatformsProfiles as any).mockResolvedValue({
      instagram: {
        connected: true,
        username: 'focoauto.aryaraj',
        account_name: '@focoauto.aryaraj',
        followers_count: 63,
      },
      youtube: {
        connected: true,
        channel_id: 'UC123',
        title: 'aryaraj tech',
        custom_url: '@aryarajtechinfo',
        subscriber_count: 6,
        video_count: 15,
      },
      tiktok: {
        connected: true,
        username: '@focoauto',
        display_name: 'Foco Auto',
        follower_count: 2450,
      },
    });

    render(
      <Navbar
        onOpenUpload={vi.fn()}
        onRefresh={vi.fn()}
        onOpenAccounts={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('navbar-social-summary-btn')).toBeInTheDocument();
    });

    // Antes de clicar, o popover está fechado
    expect(screen.queryByTestId('navbar-social-badges')).not.toBeInTheDocument();

    // Clica no botão unificado para abrir o popover
    fireEvent.click(screen.getByTestId('navbar-social-summary-btn'));

    // Agora o popover está visível com os dados de cada canal
    expect(screen.getByTestId('navbar-social-badges')).toBeInTheDocument();

    // Instagram
    expect(screen.getByTestId('navbar-instagram-profile-badge')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-ig-username')).toHaveTextContent('@focoauto.aryaraj');
    expect(screen.getByTestId('navbar-ig-followers')).toHaveTextContent('63 seguidores');

    // YouTube
    expect(screen.getByTestId('navbar-youtube-profile-badge')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-yt-username')).toHaveTextContent('@aryarajtechinfo');
    expect(screen.getByTestId('navbar-yt-subscribers')).toHaveTextContent('6 inscritos');

    // TikTok
    expect(screen.getByTestId('navbar-tiktok-profile-badge')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-tk-username')).toHaveTextContent('@focoauto');
    expect(screen.getByTestId('navbar-tk-followers')).toHaveTextContent('2.450 seguidores');

    // Clica novamente para fechar
    fireEvent.click(screen.getByTestId('navbar-social-summary-btn'));
    expect(screen.queryByTestId('navbar-social-badges')).not.toBeInTheDocument();
  });

  it('exibe opção de conexão no card do TikTok quando não conectado e permite abrir modal de contas', async () => {
    (api.getPlatformsProfiles as any).mockResolvedValue({
      instagram: { connected: true, username: 'focoauto', followers_count: 63 },
      youtube: { connected: true, custom_url: '@canal', subscriber_count: 6 },
      tiktok: { connected: false, follower_count: 0 },
    });

    const handleAccounts = vi.fn();

    render(
      <Navbar
        onOpenUpload={vi.fn()}
        onRefresh={vi.fn()}
        onOpenAccounts={handleAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('navbar-social-summary-btn')).toBeInTheDocument();
    });

    // Abre o popover
    fireEvent.click(screen.getByTestId('navbar-social-summary-btn'));

    const tkBadge = screen.getByTestId('navbar-tiktok-profile-badge');
    expect(tkBadge).toBeInTheDocument();
    expect(screen.getByTestId('navbar-tk-followers')).toHaveTextContent('0 seguidores (Conectar)');

    // Clicar no card do TikTok não conectado aciona o modal de contas
    fireEvent.click(tkBadge);
    expect(handleAccounts).toHaveBeenCalledTimes(1);
  });

  it('fecha o popover ao pressionar a tecla Escape', async () => {
    (api.getPlatformsProfiles as any).mockResolvedValue({
      instagram: { connected: true, followers_count: 10 },
      youtube: { connected: true, subscriber_count: 5 },
      tiktok: { connected: true, follower_count: 2 },
    });

    render(
      <Navbar
        onOpenUpload={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('navbar-social-summary-btn')).toBeInTheDocument();
    });

    // Abre o popover
    fireEvent.click(screen.getByTestId('navbar-social-summary-btn'));
    expect(screen.getByTestId('navbar-social-badges')).toBeInTheDocument();

    // Pressiona Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('navbar-social-badges')).not.toBeInTheDocument();
  });

  it('utiliza fallbacks individuais caso o endpoint unificado falhe', async () => {
    (api.getPlatformsProfiles as any).mockRejectedValue(new Error('Network error'));
    (api.getInstagramProfile as any).mockResolvedValue({
      connected: true,
      username: 'fallback_ig',
      account_name: '@fallback_ig',
      followers_count: 88,
    });
    (api.getYoutubeProfile as any).mockResolvedValue({
      connected: true,
      custom_url: '@fallback_yt',
      subscriber_count: 120,
    });
    (api.getTiktokProfile as any).mockResolvedValue({
      connected: true,
      username: '@fallback_tk',
      follower_count: 500,
    });

    render(
      <Navbar
        onOpenUpload={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('navbar-social-summary-btn')).toBeInTheDocument();
    });

    // Abre o popover
    fireEvent.click(screen.getByTestId('navbar-social-summary-btn'));

    expect(screen.getByTestId('navbar-ig-username')).toHaveTextContent('@fallback_ig');
    expect(screen.getByTestId('navbar-yt-subscribers')).toHaveTextContent('120 inscritos');
    expect(screen.getByTestId('navbar-tk-followers')).toHaveTextContent('500 seguidores');
  });
});
