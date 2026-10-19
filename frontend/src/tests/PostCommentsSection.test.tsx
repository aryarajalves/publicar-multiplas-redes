import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostCommentsSection } from '../components/PostCommentsSection';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getPostComments: vi.fn(),
    replyPostComment: vi.fn(),
  },
}));

describe('PostCommentsSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e renderiza a lista de comentários com autor, texto e respostas', async () => {
    (api.getPostComments as any).mockResolvedValue({
      success: true,
      platform: 'instagram',
      total_count: 1,
      comments: [
        {
          id: 'c1',
          platform: 'instagram',
          username: 'robertosilva',
          text: 'Comenta CUSTO que eu quero ver!',
          timestamp: '2026-10-19T18:00:00Z',
          like_count: 4,
          replies: [
            {
              id: 'r1',
              username: 'focoauto.aryaraj',
              text: 'Te enviei no direct Roberto!',
              timestamp: '2026-10-19T18:05:00Z',
              like_count: 1
            }
          ]
        }
      ]
    });

    render(
      <PostCommentsSection
        postId={10}
        platform="instagram"
        externalPostId="1784140001"
      />
    );

    expect(screen.getByText('Comentários & Respostas')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('@robertosilva')).toBeInTheDocument();
      expect(screen.getByText('Comenta CUSTO que eu quero ver!')).toBeInTheDocument();
      expect(screen.getByText('@focoauto.aryaraj')).toBeInTheDocument();
      expect(screen.getByText('Te enviei no direct Roberto!')).toBeInTheDocument();
      expect(screen.getByText('1 comentário')).toBeInTheDocument();
    });
  });

  it('exibe alerta explicativo quando o token não possui permissão de gerenciar comentários', async () => {
    (api.getPostComments as any).mockResolvedValue({
      success: false,
      platform: 'instagram',
      detail: "O token do Instagram não possui a permissão 'instagram_manage_comments'. Habilite essa permissão no Meta Developers para visualizar os comentários.",
      total_count: 0,
      comments: []
    });

    render(
      <PostCommentsSection
        postId={10}
        platform="instagram"
        externalPostId="178414001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('comments-permission-alert')).toBeInTheDocument();
      expect(screen.getByText(/instagram_manage_comments/)).toBeInTheDocument();
    });
  });

  it('exibe estado vazio quando o post não possui nenhum comentário ainda', async () => {
    (api.getPostComments as any).mockResolvedValue({
      success: true,
      platform: 'youtube',
      total_count: 0,
      comments: []
    });

    render(
      <PostCommentsSection
        postId={12}
        platform="youtube"
        externalPostId="yt_vid_99"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('comments-empty')).toBeInTheDocument();
      expect(screen.getByText('Nenhum comentário recebido ainda.')).toBeInTheDocument();
    });
  });

  it('permite responder a um comentário específico', async () => {
    (api.getPostComments as any).mockResolvedValue({
      success: true,
      platform: 'youtube',
      total_count: 1,
      comments: [
        {
          id: 'yt_c1',
          platform: 'youtube',
          username: 'marcosdev',
          text: 'Qual o link da ferramenta?',
          like_count: 2,
          replies: []
        }
      ]
    });

    (api.replyPostComment as any).mockResolvedValue({
      success: true,
      id: 'yt_r1',
      message: 'Resposta enviada com sucesso!'
    });

    render(
      <PostCommentsSection
        postId={15}
        platform="youtube"
        externalPostId="yt_vid_123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('@marcosdev')).toBeInTheDocument();
    });

    // Clica no botão Responder
    const btnReply = screen.getByTestId('btn-reply-yt_c1');
    fireEvent.click(btnReply);

    // Digita a resposta
    const inputReply = screen.getByTestId('input-reply-yt_c1');
    fireEvent.change(inputReply, { target: { value: 'Segue o link oficial!' } });

    await waitFor(() => {
      expect(screen.getByTestId('btn-submit-reply-yt_c1')).not.toBeDisabled();
    });

    // Submete a resposta
    fireEvent.click(screen.getByTestId('btn-submit-reply-yt_c1'));

    await waitFor(() => {
      expect(api.replyPostComment).toHaveBeenCalledWith(15, {
        platform: 'youtube',
        message: 'Segue o link oficial!',
        comment_id: 'yt_c1'
      });
      expect(screen.getByText('Resposta publicada com sucesso!')).toBeInTheDocument();
    });
  });
});
