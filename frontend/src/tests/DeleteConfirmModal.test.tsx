import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Post } from '../types';

const mockPost: Post = {
  id: 42,
  title: 'Como Usar Produtos Baratos Para Escalar Suas Vendas',
  caption: 'Legenda do vídeo sobre escala e vendas.',
  video_filename: 'video_42.mp4',
  video_path: 'uploads/video_42.mp4',
  thumbnail_path: 'uploads/thumbnails/thumb_42.png',
  status: 'published',
  scheduled_at: '2026-10-10T15:27:00Z',
  created_at: '2026-10-10T15:20:00Z',
  updated_at: '2026-10-10T15:27:00Z',
  publications: [],
};

describe('DeleteConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteConfirmModal
        isOpen={false}
        post={mockPost}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
  });

  it('does not render when post is null', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
  });

  it('renders modal with correct title, post title and buttons', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={mockPost}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('delete-modal-title')).toHaveTextContent('Excluir Publicação');
    expect(screen.getByTestId('delete-modal-post-title')).toHaveTextContent(
      'Como Usar Produtos Baratos Para Escalar Suas Vendas'
    );
    expect(screen.getByText(/esta ação é definitiva/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
  });

  it('does NOT close when clicking on the backdrop outside the modal', () => {
    const handleClose = vi.fn();
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={mockPost}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    const backdrop = screen.getByTestId('delete-confirm-modal');
    fireEvent.click(backdrop);

    // Deve garantir que NÃO fecha ao clicar fora
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking Cancel button or close X button', () => {
    const handleClose = vi.fn();
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={mockPost}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    // Cancelar
    fireEvent.click(screen.getByTestId('btn-cancel-delete'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Fechar (X)
    fireEvent.click(screen.getByTestId('btn-close-delete-modal'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when clicking "Sim, Excluir Publicação"', async () => {
    const handleConfirm = vi.fn();
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={mockPost}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('btn-confirm-delete'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and shows spinner when isDeleting is true', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={mockPost}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={true}
      />
    );

    expect(screen.getByTestId('btn-cancel-delete')).toBeDisabled();
    expect(screen.getByTestId('btn-confirm-delete')).toBeDisabled();
    expect(screen.getByText('Excluindo...')).toBeInTheDocument();
  });

  it('displays errorMessage when provided', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        post={mockPost}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        errorMessage="Erro no banco de dados ao excluir."
      />
    );

    expect(screen.getByTestId('delete-modal-error')).toBeInTheDocument();
    expect(screen.getByText('Erro no banco de dados ao excluir.')).toBeInTheDocument();
  });
});
