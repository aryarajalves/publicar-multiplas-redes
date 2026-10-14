import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { VideoUploadModal } from '../components/VideoUploadModal';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    createPost: vi.fn(),
    generateAIContent: vi.fn(),
    generateThumbnail: vi.fn(),
    getYoutubeVideoOptions: vi.fn().mockResolvedValue([]),
    getVideoUrl: vi.fn((path: string) => path ? `http://localhost:8000/${path}` : ''),
  },
}));

describe('VideoUploadModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = 'unset';
  });

  it('does not render when isOpen is false', () => {
    render(<VideoUploadModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.queryByTestId('video-upload-modal')).not.toBeInTheDocument();
  });

  it('renders correctly and locks body scroll when open', () => {
    const { unmount } = render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByTestId('video-upload-modal')).toBeInTheDocument();
    expect(screen.getByText('Publicar Conteúdo Multi-Redes')).toBeInTheDocument();
    expect(screen.getByTestId('content-tab-youtube')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-related-video-input')).toBeInTheDocument();
    expect(screen.getByTestId('btn-youtube-type-long')).toBeInTheDocument();
    expect(screen.getByTestId('btn-youtube-type-shorts')).toBeInTheDocument();
    expect(screen.getByTestId('submit-schedule-btn')).toBeInTheDocument();
    
    // Verifica que o scroll da página de fundo está travado
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('ensures NO AI generation banner or OpenAI buttons are rendered', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    // Upload do vídeo
    const file = new File(['dummy-video'], 'meu_video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verifica que elementos de IA NÃO existem na tela
    expect(screen.queryByTestId('btn-generate-ai')).not.toBeInTheDocument();
    expect(screen.queryByText(/Otimização Automática com IA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gerar com IA/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('base-text-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('youtube-instructions-input')).not.toBeInTheDocument();
  });

  it('shows error message if submitting without a file', async () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);
    
    // Fill title
    fireEvent.change(screen.getByTestId('youtube-title-input'), { target: { value: 'Título sem vídeo' } });
    
    const submitBtn = screen.getByTestId('submit-schedule-btn');
    fireEvent.click(submitBtn);

    expect(screen.getAllByText(/selecione um arquivo de vídeo/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches platform tabs and shows specific inputs', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    // YouTube (inicialmente ativo por padrão)
    expect(screen.getByTestId('content-tab-youtube')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-related-video-input')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-tags-input')).toBeInTheDocument();
    expect(screen.getByTestId('btn-maximize-youtube-tags')).toBeInTheDocument();

    // Troca para aba Instagram
    const igTab = screen.getByTestId('tab-instagram');
    fireEvent.click(igTab);

    expect(screen.getByTestId('content-tab-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('instagram-caption-input')).toBeInTheDocument();
    expect(screen.queryByTestId('instagram-hashtags-input')).not.toBeInTheDocument();

    // Troca para aba TikTok
    const tkTab = screen.getByTestId('tab-tiktok');
    fireEvent.click(tkTab);

    expect(screen.getByTestId('content-tab-tiktok')).toBeInTheDocument();
    expect(screen.getByTestId('tiktok-caption-input')).toBeInTheDocument();
    expect(screen.queryByTestId('tiktok-hashtags-input')).not.toBeInTheDocument();
  });

  it('opens expanded field modal when maximizing YouTube tags', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const maxTagsBtn = screen.getByTestId('btn-maximize-youtube-tags');
    fireEvent.click(maxTagsBtn);

    expect(screen.getByTestId('expanded-field-modal')).toBeInTheDocument();
    expect(screen.getByText('Tags de Busca do YouTube')).toBeInTheDocument();
    expect(screen.getByTestId('expanded-youtube-tags')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('btn-close-expanded-modal');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('expanded-field-modal')).not.toBeInTheDocument();
  });

  it('toggles between Vídeo Longo and Shorts formats in YouTube tab', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const btnLong = screen.getByTestId('btn-youtube-type-long');
    const btnShorts = screen.getByTestId('btn-youtube-type-shorts');

    // Clica em Vídeo Longo (16:9)
    fireEvent.click(btnLong);
    expect(screen.getAllByText(/Vídeo Longo \(16:9\)/i).length).toBeGreaterThanOrEqual(1);

    // Alterna de volta para Shorts (Vertical)
    fireEvent.click(btnShorts);
    expect(screen.getAllByText(/Shorts \(9:16\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('enforces 500 characters limit and renders dynamic counter on YouTube tags input', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const tagsInput = screen.getByTestId('youtube-tags-input') as HTMLInputElement;
    const counter = screen.getByTestId('youtube-tags-counter');

    // Contador inicial 0/500
    expect(counter).toHaveTextContent('0/500');
    expect(tagsInput).toHaveAttribute('maxLength', '500');

    // Digita 20 caracteres
    fireEvent.change(tagsInput, { target: { value: 'tag1, tag2, tag3, t4' } });
    expect(counter).toHaveTextContent('20/500');

    // Tenta digitar mais de 500 caracteres (ex: 520)
    const longTags = 'a'.repeat(520);
    fireEvent.change(tagsInput, { target: { value: longTags } });

    // Deve respeitar a restrição e não ultrapassar 500 caracteres
    expect(tagsInput.value.length).toBeLessThanOrEqual(500);
  });

  it('submits successfully with video, title, description and youtube_related_video', async () => {
    (api.createPost as any).mockResolvedValueOnce({ id: 101, title: 'Vídeo Direto Sem IA' });

    const handleSuccess = vi.fn();
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={handleSuccess} />);

    // Video
    const videoFile = new File(['fake-vid-bytes'], 'video_aula.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [videoFile] } });

    // Titulo, Descrição e Vídeo Final no YouTube
    fireEvent.change(screen.getByTestId('youtube-title-input'), { target: { value: 'Vídeo Direto Sem IA' } });
    fireEvent.change(screen.getByTestId('youtube-description-input'), { target: { value: 'Minha super legenda compartilhada em todas as redes!' } });
    fireEvent.change(screen.getByTestId('youtube-related-video-input'), { target: { value: 'https://www.youtube.com/watch?v=final123' } });

    // Enviar
    fireEvent.click(screen.getByTestId('submit-schedule-btn'));

    await waitFor(() => {
      expect(api.createPost).toHaveBeenCalledTimes(1);
    });

    const formDataCalled = (api.createPost as any).mock.calls[0][0] as FormData;
    expect(formDataCalled.get('title')).toBe('Vídeo Direto Sem IA');
    expect(formDataCalled.get('caption')).toBe('Minha super legenda compartilhada em todas as redes!');
    expect(formDataCalled.get('youtube_title')).toBe('Vídeo Direto Sem IA');
    expect(formDataCalled.get('youtube_description')).toBe('Minha super legenda compartilhada em todas as redes!');
    expect(formDataCalled.get('youtube_related_video')).toBe('https://www.youtube.com/watch?v=final123');
    expect(formDataCalled.get('platforms')).toBe(JSON.stringify(['youtube', 'instagram', 'tiktok']));
    expect(handleSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 101 }));
  });

  it('submits platform-specific details when filled in tabs', async () => {
    (api.createPost as any).mockResolvedValueOnce({ id: 102, title: 'Vídeo Customizado' });

    const handleSuccess = vi.fn();
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={handleSuccess} />);

    const videoFile = new File(['fake-vid'], 'video_custom.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [videoFile] } });

    // Configura YouTube
    fireEvent.change(screen.getByTestId('youtube-title-input'), { target: { value: 'Título Exclusivo YouTube' } });
    fireEvent.change(screen.getByTestId('youtube-description-input'), { target: { value: 'Descrição Longa do YouTube' } });
    fireEvent.change(screen.getByTestId('youtube-tags-input'), { target: { value: 'tag1, tag2' } });

    // Customiza Instagram
    fireEvent.click(screen.getByTestId('tab-instagram'));
    fireEvent.change(screen.getByTestId('instagram-caption-input'), { target: { value: 'Legenda IG Exclusiva #reels #exclusivo' } });

    // Customiza TikTok
    fireEvent.click(screen.getByTestId('tab-tiktok'));
    fireEvent.change(screen.getByTestId('tiktok-caption-input'), { target: { value: 'Legenda Rápida TikTok #tiktok #viral' } });

    // Enviar
    fireEvent.click(screen.getByTestId('submit-schedule-btn'));

    await waitFor(() => {
      expect(api.createPost).toHaveBeenCalledTimes(1);
    });

    const formDataCalled = (api.createPost as any).mock.calls[0][0] as FormData;
    expect(formDataCalled.get('youtube_title')).toBe('Título Exclusivo YouTube');
    expect(formDataCalled.get('youtube_description')).toBe('Descrição Longa do YouTube');
    expect(formDataCalled.get('youtube_tags')).toBe('tag1, tag2');
    expect(formDataCalled.get('instagram_caption')).toBe('Legenda IG Exclusiva #reels #exclusivo');
    expect(formDataCalled.get('tiktok_caption')).toBe('Legenda Rápida TikTok #tiktok #viral');
  });

  it('toggles "Publicar agora" checkbox and shows/hides schedule date (default: true)', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);
    
    const checkbox = screen.getByTestId('publish-now-checkbox');
    // Por padrão vem ativo (publicar imediatamente)
    expect(checkbox).toBeChecked();
    expect(screen.queryByTestId('schedule-date-input')).not.toBeInTheDocument();
    expect(screen.getByText('Disparo imediato ativo')).toBeInTheDocument();

    // Desmarca para agendar
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByTestId('schedule-date-input')).toBeInTheDocument();
    expect(screen.queryByText('Disparo imediato ativo')).not.toBeInTheDocument();
  });

  it('renders thumbnail upload section with vertical (9:16) and horizontal (16:9) cards', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByTestId('thumbnails-upload-section')).toBeInTheDocument();
    expect(screen.getByTestId('vertical-thumbnail-card')).toBeInTheDocument();
    expect(screen.getByTestId('horizontal-thumbnail-card')).toBeInTheDocument();
    expect(screen.getByTestId('vertical-thumb-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('horizontal-thumb-dropzone')).toBeInTheDocument();
  });

  it('handles vertical thumbnail selection, preview display, and removal', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((file: any) => `blob:mock/${file.name}`);
    URL.revokeObjectURL = vi.fn();

    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const file = new File(['fake-vert-thumb'], 'thumb_reels.png', { type: 'image/png' });
    const input = screen.getByTestId('vertical-thumb-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByTestId('vertical-thumb-preview-container')).toBeInTheDocument();
    expect(screen.getByTestId('vertical-thumb-preview-img')).toBeInTheDocument();
    expect(screen.getByText('Capa Vertical Selecionada')).toBeInTheDocument();
    expect(screen.getByText('thumb_reels.png')).toBeInTheDocument();

    // Remove a capa vertical
    const removeBtn = screen.getByTestId('btn-remove-vertical-thumb');
    fireEvent.click(removeBtn);

    expect(screen.queryByTestId('vertical-thumb-preview-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('vertical-thumb-dropzone')).toBeInTheDocument();

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('handles horizontal thumbnail selection, preview display, and removal', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((file: any) => `blob:mock/${file.name}`);
    URL.revokeObjectURL = vi.fn();

    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const file = new File(['fake-horiz-thumb'], 'thumb_yt_long.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('horizontal-thumb-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByTestId('horizontal-thumb-preview-container')).toBeInTheDocument();
    expect(screen.getByTestId('horizontal-thumb-preview-img')).toBeInTheDocument();
    expect(screen.getByText('Capa YouTube Selecionada')).toBeInTheDocument();
    expect(screen.getByText('thumb_yt_long.jpg')).toBeInTheDocument();

    // Remove a capa horizontal
    const removeBtn = screen.getByTestId('btn-remove-horizontal-thumb');
    fireEvent.click(removeBtn);

    expect(screen.queryByTestId('horizontal-thumb-preview-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('horizontal-thumb-dropzone')).toBeInTheDocument();

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('submits post with both vertical and horizontal thumbnails in formData', async () => {
    (api.createPost as any).mockResolvedValueOnce({ id: 103, title: 'Vídeo Com Duas Capas' });

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((file: any) => `blob:mock/${file.name}`);
    URL.revokeObjectURL = vi.fn();

    const handleSuccess = vi.fn();
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={handleSuccess} />);

    // Video
    const videoFile = new File(['fake-vid'], 'video_principal.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [videoFile] } });

    // Titulo
    fireEvent.change(screen.getByTestId('youtube-title-input'), { target: { value: 'Vídeo Com Duas Capas' } });

    // Thumb Vertical (9:16)
    const vertFile = new File(['fake-vert'], 'vertical_capa.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('vertical-thumb-input'), { target: { files: [vertFile] } });

    // Thumb Horizontal (16:9)
    const horizFile = new File(['fake-horiz'], 'horizontal_capa.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('horizontal-thumb-input'), { target: { files: [horizFile] } });

    // Enviar
    fireEvent.click(screen.getByTestId('submit-schedule-btn'));

    await waitFor(() => {
      expect(api.createPost).toHaveBeenCalledTimes(1);
    });

    const formDataCalled = (api.createPost as any).mock.calls[0][0] as FormData;
    expect(formDataCalled.get('thumbnail')).toBe(vertFile);
    expect(formDataCalled.get('youtube_thumbnail')).toBe(horizFile);
    expect(handleSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 103 }));

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('allows maximizing YouTube description and confirming changes', () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    // Clica no botão de maximizar da descrição do YouTube
    const maxYtDescBtn = screen.getByTestId('btn-maximize-youtube-description');
    fireEvent.click(maxYtDescBtn);

    const modal = screen.getByTestId('expanded-field-modal');
    expect(within(modal).getByText('Descrição Detalhada do Vídeo (YouTube)')).toBeInTheDocument();

    // Altera o texto
    const expandedTextarea = screen.getByTestId('expanded-field-textarea') as HTMLTextAreaElement;
    fireEvent.change(expandedTextarea, {
      target: { value: '00:00 Introdução\n01:30 Pontos principais\n\nPrincipais Pontos Abordados:\n- Detalhe 1' },
    });

    // Fecha usando o botão 'Concluir & Voltar'
    const confirmBtn = screen.getByTestId('btn-expanded-confirm');
    fireEvent.click(confirmBtn);

    expect(screen.queryByTestId('expanded-field-modal')).not.toBeInTheDocument();

    // Verifica que a descrição no input da aba do YouTube permaneceu correta
    const ytDescInput = screen.getByTestId('youtube-description-input') as HTMLTextAreaElement;
    expect(ytDescInput.value).toContain('00:00 Introdução');
    expect(ytDescInput.value).toContain('Principais Pontos Abordados:');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<VideoUploadModal isOpen={true} onClose={handleClose} onSuccess={vi.fn()} />);
    
    const closeBtn = screen.getByTestId('btn-close-upload-modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('displays footer error message when validation fails', async () => {
    render(<VideoUploadModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    // Click submit without file
    const submitBtn = screen.getByTestId('submit-schedule-btn');
    fireEvent.click(submitBtn);

    expect(screen.getByTestId('footer-error-message')).toBeInTheDocument();
    expect(screen.getByTestId('footer-error-message')).toHaveTextContent(/selecione um arquivo de vídeo/i);
  });
});
