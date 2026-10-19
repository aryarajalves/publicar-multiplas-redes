import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostsTabContent } from '../components/PostsTabContent';
import { Post, PlatformOverview } from '../types';

const mockOverview: PlatformOverview = {
  total_posts: 10,
  total_scheduled: 4,
  total_published: 5,
  total_failed: 1,
  platforms: [
    { platform: 'instagram', configured: true, total_published: 3, total_pending: 2, total_failed: 0 },
    { platform: 'youtube', configured: true, total_published: 2, total_pending: 1, total_failed: 0 },
    { platform: 'tiktok', configured: true, total_published: 0, total_pending: 2, total_failed: 0 },
  ],
};

const mockPost: Post = {
  id: 1,
  title: 'Vídeo Exemplo',
  caption: 'Legenda do vídeo',
  video_filename: 'video.mp4',
  video_path: 'uploads/video.mp4',
  status: 'scheduled',
  scheduled_at: '2026-10-25T14:00:00Z',
  created_at: '2026-10-10T12:00:00Z',
  updated_at: '2026-10-10T12:00:00Z',
  publications: [],
};

describe('PostsTabContent Component', () => {
  it('renders overview stats, filters and post cards when posts exist', () => {
    const handleViewDetails = vi.fn();
    const handlePublishNow = vi.fn();
    const handleDelete = vi.fn();

    render(
      <PostsTabContent
        error={null}
        overview={mockOverview}
        posts={[mockPost]}
        totalPosts={1}
        page={1}
        itemsPerPage={20}
        search=""
        status=""
        platform=""
        isLoading={false}
        onRefresh={vi.fn()}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
        onPlatformChange={vi.fn()}
        onPageChange={vi.fn()}
        onViewDetails={handleViewDetails}
        onPublishNow={handlePublishNow}
        onDelete={handleDelete}
        onOpenUpload={vi.fn()}
      />
    );

    // Confirma OverviewStats
    expect(screen.getByTestId('overview-stats')).toBeInTheDocument();
    // Confirma PostFilters via campo de busca
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    // Confirma card do post
    expect(screen.getByText('Vídeo Exemplo')).toBeInTheDocument();
  });

  it('renders empty state when posts list is empty', () => {
    const handleOpenUpload = vi.fn();

    render(
      <PostsTabContent
        error={null}
        overview={mockOverview}
        posts={[]}
        totalPosts={0}
        page={1}
        itemsPerPage={20}
        search=""
        status=""
        platform=""
        isLoading={false}
        onRefresh={vi.fn()}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
        onPlatformChange={vi.fn()}
        onPageChange={vi.fn()}
        onViewDetails={vi.fn()}
        onPublishNow={vi.fn()}
        onDelete={vi.fn()}
        onOpenUpload={handleOpenUpload}
      />
    );

    expect(screen.getByText('Nenhuma publicação encontrada')).toBeInTheDocument();
    const btn = screen.getByText('Agendar Primeiro Vídeo');
    fireEvent.click(btn);
    expect(handleOpenUpload).toHaveBeenCalledTimes(1);
  });

  it('renders error banner when error prop is provided', () => {
    const handleRefresh = vi.fn();

    render(
      <PostsTabContent
        error="Falha na conexão com a API"
        overview={null}
        posts={[]}
        totalPosts={0}
        page={1}
        itemsPerPage={20}
        search=""
        status=""
        platform=""
        isLoading={false}
        onRefresh={handleRefresh}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
        onPlatformChange={vi.fn()}
        onPageChange={vi.fn()}
        onViewDetails={vi.fn()}
        onPublishNow={vi.fn()}
        onDelete={vi.fn()}
        onOpenUpload={vi.fn()}
      />
    );

    expect(screen.getByText('Falha na conexão com a API')).toBeInTheDocument();
    const retryBtn = screen.getByText('Tentar Novamente');
    fireEvent.click(retryBtn);
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });
});
