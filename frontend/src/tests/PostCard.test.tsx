import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from '../components/PostCard';
import { Post } from '../types';

const mockPost: Post = {
  id: 42,
  title: 'Vídeo Revelador sobre Produtividade',
  caption: 'Dicas rápidas para aumentar o foco',
  video_filename: 'produtividade.mp4',
  video_path: 'uploads/produtividade.mp4',
  status: 'scheduled',
  scheduled_at: '2026-10-15T14:30:00Z',
  created_at: '2026-10-09T12:00:00Z',
  updated_at: '2026-10-09T12:00:00Z',
  publications: [
    {
      id: 1,
      post_id: 42,
      platform: 'instagram',
      status: 'pending',
      retry_count: 0,
      created_at: '2026-10-09T12:00:00Z',
      updated_at: '2026-10-09T12:00:00Z',
    },
    {
      id: 2,
      post_id: 42,
      platform: 'youtube',
      status: 'pending',
      retry_count: 0,
      created_at: '2026-10-09T12:00:00Z',
      updated_at: '2026-10-09T12:00:00Z',
    },
  ],
};

describe('PostCard Component', () => {
  it('renders post title and caption correctly', () => {
    const handleView = vi.fn();
    const handlePublish = vi.fn();
    const handleDelete = vi.fn();

    render(
      <PostCard
        post={mockPost}
        onViewDetails={handleView}
        onPublishNow={handlePublish}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByText('Vídeo Revelador sobre Produtividade')).toBeInTheDocument();
    expect(screen.getByText('Dicas rápidas para aumentar o foco')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('YouTube Shorts')).toBeInTheDocument();
  });

  it('renders "YouTube Vídeo Longo" when post.youtube_video_type is "Vídeo Padrão"', () => {
    const longVideoPost: Post = {
      ...mockPost,
      youtube_video_type: 'Vídeo Padrão',
    };

    render(
      <PostCard
        post={longVideoPost}
        onViewDetails={vi.fn()}
        onPublishNow={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('YouTube Vídeo Longo')).toBeInTheDocument();
  });

  it('calls onViewDetails when Detalhes button is clicked', () => {
    const handleView = vi.fn();
    render(
      <PostCard
        post={mockPost}
        onViewDetails={handleView}
        onPublishNow={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const detailsBtn = screen.getByTestId('btn-view-details-42');
    fireEvent.click(detailsBtn);
    expect(handleView).toHaveBeenCalledWith(mockPost);
  });

  it('calls onPublishNow when Publicar Agora button is clicked', () => {
    const handlePublish = vi.fn();
    render(
      <PostCard
        post={mockPost}
        onViewDetails={vi.fn()}
        onPublishNow={handlePublish}
        onDelete={vi.fn()}
      />
    );

    const publishBtn = screen.getByTestId('btn-publish-now-42');
    fireEvent.click(publishBtn);
    expect(handlePublish).toHaveBeenCalledWith(mockPost);
  });

  it('calls onDelete when trash icon button is clicked', () => {
    const handleDelete = vi.fn();
    render(
      <PostCard
        post={mockPost}
        onViewDetails={vi.fn()}
        onPublishNow={vi.fn()}
        onDelete={handleDelete}
      />
    );

    const deleteBtn = screen.getByTestId('btn-delete-42');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockPost);
  });

  it('does not display "Publicar Agora" if post status is already published', () => {
    const publishedPost: Post = { ...mockPost, status: 'published' };
    render(
      <PostCard
        post={publishedPost}
        onViewDetails={vi.fn()}
        onPublishNow={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTestId('btn-publish-now-42')).not.toBeInTheDocument();
  });

  it('renders thumbnail image if post has a thumbnail', () => {
    const postWithThumb: Post = {
      ...mockPost,
      thumbnail_path: 'uploads/thumbnails/my_thumb.png',
    };
    render(
      <PostCard
        post={postWithThumb}
        onViewDetails={vi.fn()}
        onPublishNow={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('post-card-thumb-42')).toBeInTheDocument();
  });
});
