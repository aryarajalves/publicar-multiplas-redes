import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostDetailsModal } from '../components/PostDetailsModal';
import { Post } from '../types';

const samplePost: Post = {
  id: 1,
  title: 'Meu Post de Teste',
  caption: 'Legenda geral',
  video_filename: 'teste.mp4',
  video_path: 'uploads/teste.mp4',
  status: 'scheduled',
  scheduled_at: '2026-10-15T15:00:00Z',
  created_at: '2026-10-09T12:00:00Z',
  updated_at: '2026-10-09T12:00:00Z',
  transcription: 'Transcrição do vídeo falado em detalhes com OpenAI Whisper.',
  instagram_caption: 'Legenda curta e envolvente do Instagram.',
  instagram_hashtags: '#reels #dicas #ia #produtividade #viral',
  youtube_title: 'Como Automatizar Seus Vídeos no YouTube (Passo a Passo)',
  youtube_description: 'Descrição completa do vídeo no YouTube.',
  youtube_tags: 'ia, automacao, youtube',
  youtube_video_type: 'Shorts',
  tiktok_caption: 'Dica rápida do TikTok!',
  tiktok_hashtags: '#tiktok #dicas #foryou #viral #aprender',
  publications: [
    {
      id: 1,
      post_id: 1,
      platform: 'instagram',
      status: 'pending',
      retry_count: 0,
      created_at: '2026-10-09T12:00:00Z',
      updated_at: '2026-10-09T12:00:00Z',
    },
    {
      id: 2,
      post_id: 1,
      platform: 'youtube',
      status: 'pending',
      retry_count: 0,
      created_at: '2026-10-09T12:00:00Z',
      updated_at: '2026-10-09T12:00:00Z',
    },
  ],
};

describe('PostDetailsModal Component', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset';
  });

  it('does not render when post is null', () => {
    render(<PostDetailsModal post={null} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByTestId('post-details-modal')).not.toBeInTheDocument();
  });

  it('renders correctly and locks body scroll when post is provided', () => {
    const { unmount } = render(
      <PostDetailsModal post={samplePost} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByTestId('post-details-modal')).toBeInTheDocument();
    // Confirma que o scroll de fundo foi bloqueado
    expect(document.body.style.overflow).toBe('hidden');

    // Confirma que exibe a transcrição do áudio
    expect(screen.getByText(/Transcrição do Áudio/i)).toBeInTheDocument();
    expect(screen.getByText(/Transcrição do vídeo falado em detalhes/i)).toBeInTheDocument();

    // Confirma abas de redes sociais presentes
    expect(screen.getByTestId('tab-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('tab-youtube')).toBeInTheDocument();

    // Confirma conteúdo específico do Instagram (primeira aba ativa)
    expect(screen.getByText('Legenda curta e envolvente do Instagram.')).toBeInTheDocument();
    expect(screen.getByText('#reels #dicas #ia #produtividade #viral')).toBeInTheDocument();

    // Alterna para a aba do YouTube
    fireEvent.click(screen.getByTestId('tab-youtube'));

    // Confirma conteúdo específico do YouTube após trocar de aba
    expect(screen.getAllByText('Como Automatizar Seus Vídeos no YouTube (Passo a Passo)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Descrição completa do vídeo no YouTube.')).toBeInTheDocument();

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('switches tabs and copies content to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <PostDetailsModal post={samplePost} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />
    );

    const instagramTab = screen.getByTestId('tab-instagram');
    const youtubeTab = screen.getByTestId('tab-youtube');

    expect(instagramTab).toHaveAttribute('aria-selected', 'true');
    expect(youtubeTab).toHaveAttribute('aria-selected', 'false');

    // Clica no botão de copiar na aba do Instagram
    const copyBtn = screen.getByText('Copiar Texto');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('Legenda curta e envolvente do Instagram.');
    expect(screen.getByText('Copiado!')).toBeInTheDocument();

    // Troca para a aba do YouTube
    fireEvent.click(youtubeTab);
    expect(youtubeTab).toHaveAttribute('aria-selected', 'true');
    expect(instagramTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<PostDetailsModal post={samplePost} onClose={handleClose} onPublishNow={vi.fn()} onDelete={vi.fn()} />);

    const closeBtn = screen.getByTestId('btn-close-details');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders thumbnails container when post has vertical and horizontal thumbnails', () => {
    const postWithThumbs: Post = {
      ...samplePost,
      thumbnail_path: 'uploads/thumbnails/thumb_vertical_123.png',
      youtube_thumbnail_path: 'uploads/thumbnails/thumb_youtube_long_456.jpg',
    };

    render(<PostDetailsModal post={postWithThumbs} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByTestId('post-thumbnails-container')).toBeInTheDocument();
    expect(screen.getByTestId('detail-vertical-thumbnail')).toBeInTheDocument();
    expect(screen.getByTestId('detail-vertical-thumb-img')).toBeInTheDocument();
    expect(screen.getByTestId('link-view-vertical-thumb')).toBeInTheDocument();

    expect(screen.getByTestId('detail-horizontal-thumbnail')).toBeInTheDocument();
    expect(screen.getByTestId('detail-horizontal-thumb-img')).toBeInTheDocument();
    expect(screen.getByTestId('link-view-horizontal-thumb')).toBeInTheDocument();
  });

  it('renders youtube_related_video link when present on post and youtube tab is active', () => {
    const postWithRelated: Post = {
      ...samplePost,
      youtube_related_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    render(<PostDetailsModal post={postWithRelated} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />);

    // Clica na aba do YouTube para visualizar o card do YouTube
    fireEvent.click(screen.getByTestId('tab-youtube'));

    expect(screen.getByTestId('detail-youtube-related-video')).toBeInTheDocument();
    expect(screen.getByText('🎬 Vídeo no Final / Recomendado:')).toBeInTheDocument();
    expect(screen.getByText('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeInTheDocument();
  });

  it('renders PostMetricsSummary card and platform metrics when post is published', () => {
    const publishedPost: Post = {
      ...samplePost,
      status: 'published',
      total_likes: 3500,
      total_comments: 120,
      total_shares: 45,
      total_saves: 88,
      total_views: 45000,
      publications: [
        {
          id: 10,
          post_id: 1,
          platform: 'instagram',
          status: 'published',
          last_likes: 3500,
          last_comments: 120,
          last_shares: 45,
          last_saves: 88,
          last_views: 45000,
          last_metrics_sync_at: '2026-10-19T14:00:00Z',
          retry_count: 0,
          created_at: '2026-10-09T12:00:00Z',
          updated_at: '2026-10-09T12:00:00Z',
        },
      ],
    };

    render(<PostDetailsModal post={publishedPost} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />);

    // Resumo de métricas
    expect(screen.getByTestId('post-metrics-summary-card')).toBeInTheDocument();
    expect(screen.getByText(/Desempenho & Engajamento em Tempo Real/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-sync-post-metrics')).toBeInTheDocument();
    expect(screen.getAllByText('3.500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('45.000').length).toBeGreaterThanOrEqual(1);

    // Métricas por rede dentro da aba ativa (Instagram)
    expect(screen.getByTestId('publication-metrics-instagram')).toBeInTheDocument();
    expect(screen.getByText(/Desempenho nesta Rede/i)).toBeInTheDocument();
  });
});

