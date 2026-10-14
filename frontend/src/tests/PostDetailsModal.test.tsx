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

    // Confirma conteúdo específico do Instagram
    expect(screen.getByText('Legenda curta e envolvente do Instagram.')).toBeInTheDocument();
    expect(screen.getByText('#reels #dicas #ia #produtividade #viral')).toBeInTheDocument();

    // Confirma conteúdo específico do YouTube
    expect(screen.getAllByText('Como Automatizar Seus Vídeos no YouTube (Passo a Passo)').length).toBeGreaterThanOrEqual(1);

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
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

  it('renders youtube_related_video link when present on post', () => {
    const postWithRelated: Post = {
      ...samplePost,
      youtube_related_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    render(<PostDetailsModal post={postWithRelated} onClose={vi.fn()} onPublishNow={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByTestId('detail-youtube-related-video')).toBeInTheDocument();
    expect(screen.getByText('🎬 Vídeo no Final / Recomendado:')).toBeInTheDocument();
    expect(screen.getByText('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeInTheDocument();
  });
});
