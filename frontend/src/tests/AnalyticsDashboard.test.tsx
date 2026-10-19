import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getPosts: vi.fn(),
    getVideoUrl: vi.fn().mockImplementation((path: string) => path ? `/media/${path}` : ''),
    syncAnalytics: vi.fn().mockResolvedValue({ success: true }),
    getWinningFormula: vi.fn(),
    generateScriptVariations: vi.fn(),
  },
}));

describe('AnalyticsDashboard Component', () => {
  const mockPosts = [
    {
      id: 1,
      title: 'Como monetizar cortes de videos curtos em 2026',
      video_filename: 'video_corte.mp4',
      video_path: '/videos/video_corte.mp4',
      thumbnail_path: 'corte_thumb.png',
      status: 'published',
      scheduled_at: '2026-10-15T14:00:00Z',
      created_at: '2026-10-15T12:00:00Z',
      transcription: 'Pare de perder tempo tentando monetizar videos da forma errada. Hoje vou revelar o metodo.',
      publications: [
        {
          id: 101,
          post_id: 1,
          platform: 'youtube',
          status: 'published',
          published_at: '2026-10-15T14:05:00Z',
          post_url: 'https://youtube.com/watch?v=mock1',
          retry_count: 0,
          created_at: '2026-10-15T14:00:00Z',
          updated_at: '2026-10-15T14:05:00Z',
        },
        {
          id: 102,
          post_id: 1,
          platform: 'instagram',
          status: 'published',
          published_at: '2026-10-15T14:06:00Z',
          post_url: 'https://instagram.com/reel/mock1',
          retry_count: 0,
          created_at: '2026-10-15T14:00:00Z',
          updated_at: '2026-10-15T14:06:00Z',
        },
      ],
    },
    {
      id: 2,
      title: 'Tutorial passo a passo de gravacao rapida',
      video_filename: 'tutorial_rapido.mp4',
      video_path: '/videos/tutorial_rapido.mp4',
      status: 'published',
      scheduled_at: '2026-10-16T18:00:00Z',
      created_at: '2026-10-16T17:00:00Z',
      transcription: 'Neste video vamos aprender a configurar a iluminacao para gravar em menos de 5 minutos.',
      publications: [
        {
          id: 103,
          post_id: 2,
          platform: 'tiktok',
          status: 'published',
          published_at: '2026-10-16T18:02:00Z',
          post_url: 'https://tiktok.com/@mock/video2',
          retry_count: 0,
          created_at: '2026-10-16T18:00:00Z',
          updated_at: '2026-10-16T18:02:00Z',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getPosts as any).mockResolvedValue({ items: mockPosts, posts: mockPosts, total: 2 });
    (api.getWinningFormula as any).mockResolvedValue({
      total_analyzed: 2,
      top_performing_pattern: 'Vídeos com perguntas nos primeiros 3s geraram 3.2x mais engajamento',
      best_hook_example: 'Você sabia que...',
      avg_retention_lift: 38.5,
      key_rules: ['Regra #1: Gancho direto', 'Regra #2: Primeiro insight rápido'],
    });
    (api.generateScriptVariations as any).mockResolvedValue({
      success: true,
      scripts: [
        {
          id: 1,
          title: 'A Verdade Contra-Intuitiva',
          hook: 'Pare de fazer o que todo mundo faz...',
          body: ['Passo 1', 'Passo 2', 'Passo 3'],
          cta: 'Comente ROTEIRO para receber o PDF.',
          estimated_duration: '40s',
          why_it_works: 'Quebra de padrão agressiva',
        },
        {
          id: 2,
          title: 'Passo a Passo em 3 Etapas',
          hook: 'Se eu tivesse que começar do zero...',
          body: ['Fase 1', 'Fase 2', 'Fase 3'],
          cta: 'Salve para não esquecer.',
          estimated_duration: '45s',
          why_it_works: 'Lista prática com alto salvamento',
        },
      ],
    });
  });

  it('renders dashboard title and main metric cards correctly', async () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('stat-card-views')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-likes')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-engagement')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-best-video')).toBeInTheDocument();
    });
  });

  it('displays the list of analyzed videos and allows searching by title', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('video-perf-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-perf-item-2')).toBeInTheDocument();
    });

    // Filtra pelo campo de busca
    const searchInput = screen.getByTestId('input-search-analytics');
    fireEvent.change(searchInput, { target: { value: 'monetizar' } });

    expect(screen.getByTestId('video-perf-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('video-perf-item-2')).not.toBeInTheDocument();
  });

  it('filters video list by social platform tab', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('video-perf-item-1')).toBeInTheDocument();
    });

    // Clica no filtro de TikTok
    const tiktokTab = screen.getByTestId('filter-plat-tiktok');
    fireEvent.click(tiktokTab);

    // O video 2 tem publicacao no TikTok, o video 1 nao
    expect(screen.getByTestId('video-perf-item-2')).toBeInTheDocument();
    expect(screen.queryByTestId('video-perf-item-1')).not.toBeInTheDocument();

    // Retorna para Todos
    fireEvent.click(screen.getByTestId('filter-plat-all'));
    expect(screen.getByTestId('video-perf-item-1')).toBeInTheDocument();
  });

  it('opens the AI intelligence drawer with hook diagnosis and next recommendations', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-open-diagnosis-1')).toBeInTheDocument();
    });

    // Clica no botao de Raio-X de IA do primeiro video
    fireEvent.click(screen.getByTestId('btn-open-diagnosis-1'));

    await waitFor(() => {
      expect(screen.getByTestId('video-intelligence-drawer')).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Valida que o backdrop cobre a tela inteira com z-[9999] e w-screen h-screen
    const backdrop = screen.getByTestId('video-intelligence-drawer-backdrop');
    expect(backdrop.className).toContain('fixed inset-0');
    expect(backdrop.className).toContain('z-[9999]');
    expect(backdrop.className).toContain('w-screen h-screen');

    // Clica no botao de copiar ideia e valida exibicao do toast no topo direito
    expect(screen.getByTestId('btn-copy-idea-0')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-copy-idea-0'));

    const toast = screen.getByTestId('toast-copy-success');
    expect(toast).toBeInTheDocument();
    expect(toast.className).toContain('fixed top-5 right-5');
    expect(screen.getByText('Copiado com sucesso!')).toBeInTheDocument();

    // Fecha o toast
    fireEvent.click(screen.getByTestId('btn-close-toast'));
    expect(screen.queryByTestId('toast-copy-success')).not.toBeInTheDocument();

    // Fecha o drawer e valida liberacao do scroll
    fireEvent.click(screen.getByTestId('btn-close-intelligence-drawer'));
    expect(screen.queryByTestId('video-intelligence-drawer')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('triggers refresh when clicking Atualizar Metricas button', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-sync-metrics')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-sync-metrics'));

    await waitFor(() => {
      expect(api.getPosts).toHaveBeenCalledTimes(2);
    });
  });

  it('opens thumbnail in fullscreen lightbox when clicking on video thumbnail and closes correctly', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-open-lightbox-1')).toBeInTheDocument();
    });

    // Clica na thumbnail da listagem
    fireEvent.click(screen.getByTestId('btn-open-lightbox-1'));

    await waitFor(() => {
      expect(screen.getByTestId('image-lightbox-backdrop')).toBeInTheDocument();
      expect(screen.getByTestId('lightbox-full-image')).toBeInTheDocument();
      expect(screen.getByTestId('btn-open-original-image')).toBeInTheDocument();
    });

    // Fecha o lightbox
    fireEvent.click(screen.getByTestId('btn-close-lightbox'));
    expect(screen.queryByTestId('image-lightbox-backdrop')).not.toBeInTheDocument();
  });

  it('renders winning formula proven pattern card in the overview when available', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('winning-formula-summary-card')).toBeInTheDocument();
      expect(screen.getByText(/Vídeos com perguntas nos primeiros 3s/i)).toBeInTheDocument();
      expect(screen.getByText('Regra #1')).toBeInTheDocument();
    });
  });

  it('generates 5 script variations when clicking the button inside intelligence drawer and allows copying', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-open-diagnosis-1')).toBeInTheDocument();
    });

    // Abre o drawer de diagnóstico
    fireEvent.click(screen.getByTestId('btn-open-diagnosis-1'));

    await waitFor(() => {
      expect(screen.getByTestId('section-script-variations')).toBeInTheDocument();
      expect(screen.getByTestId('btn-generate-5-scripts')).toBeInTheDocument();
    });

    // Clica para gerar os 5 roteiros
    fireEvent.click(screen.getByTestId('btn-generate-5-scripts'));

    await waitFor(() => {
      expect(api.generateScriptVariations).toHaveBeenCalledWith(1);
      expect(screen.getByTestId('script-variation-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('script-variation-card-2')).toBeInTheDocument();
      expect(screen.getByText('A Verdade Contra-Intuitiva')).toBeInTheDocument();
    });

    // Copia o roteiro completo #1
    expect(screen.getByTestId('btn-copy-full-script-1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-copy-full-script-1'));

    // Verifica toast de confirmação
    await waitFor(() => {
      expect(screen.getByTestId('toast-copy-success')).toBeInTheDocument();
      expect(screen.getByText(/Roteiro #1 copiado na íntegra/i)).toBeInTheDocument();
    });
  });
});
