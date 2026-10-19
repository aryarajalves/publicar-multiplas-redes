import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublishConfirmModal } from '../components/upload/PublishConfirmModal';

describe('PublishConfirmModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <PublishConfirmModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        videoTitle="Vídeo Teste"
        platforms={['youtube', 'instagram']}
      />
    );

    expect(screen.queryByTestId('publish-confirm-modal-dialog')).not.toBeInTheDocument();
  });

  it('renders correctly with title, video title and platform badges when isOpen is true', () => {
    render(
      <PublishConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        videoTitle="Como Criar Conteúdo Multiplataforma"
        platforms={['youtube', 'instagram', 'tiktok']}
      />
    );

    expect(screen.getByTestId('publish-confirm-modal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Publicar Conteúdo Agora?')).toBeInTheDocument();
    expect(screen.getByText('"Como Criar Conteúdo Multiplataforma"')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
  });

  it('calls onClose when close button or cancel button is clicked', () => {
    render(
      <PublishConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        videoTitle="Vídeo Teste"
        platforms={['youtube']}
      />
    );

    // Clica no botão X
    fireEvent.click(screen.getByTestId('btn-close-publish-modal'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Clica no botão Cancelar
    fireEvent.click(screen.getByTestId('btn-cancel-publish'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <PublishConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        videoTitle="Vídeo Teste"
        platforms={['youtube', 'tiktok']}
      />
    );

    fireEvent.click(screen.getByTestId('btn-confirm-publish'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables buttons when isLoading is true', () => {
    render(
      <PublishConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
        videoTitle="Vídeo Teste"
        platforms={['youtube']}
      />
    );

    expect(screen.getByText('Publicando...')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel-publish')).toBeDisabled();
    expect(screen.getByTestId('btn-confirm-publish')).toBeDisabled();
    expect(screen.getByTestId('btn-close-publish-modal')).toBeDisabled();
  });
});
