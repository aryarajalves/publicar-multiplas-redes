import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YouTubeEndScreenSelect } from '../components/YouTubeEndScreenSelect';
import { api } from '../services/api';
import { YouTubeVideoOption } from '../types';

vi.mock('../services/api', () => ({
  api: {
    getYoutubeVideoOptions: vi.fn(),
  },
}));

const mockOptions: YouTubeVideoOption[] = [
  {
    post_id: 1,
    title: 'Como Criar um Agente de IA',
    youtube_id: 'abc123xyz',
    url: 'https://www.youtube.com/watch?v=abc123xyz',
    type: 'video',
    status: 'published',
    duration_formatted: '6:11',
    published_at: '2026-10-12T17:52:19Z', // Mais recente
  },
  {
    post_id: 2,
    title: 'Tutorial Completo de Python',
    youtube_id: 'def456uvw',
    url: 'https://www.youtube.com/watch?v=def456uvw',
    type: 'video',
    status: 'published',
    duration_formatted: '9:21',
    published_at: '2026-10-09T17:36:23Z', // Anterior
  },
  {
    post_id: 3,
    title: 'Shorts de 30 Segundos',
    youtube_id: 'short789',
    url: 'https://www.youtube.com/shorts/short789',
    type: 'shorts', // Deve ser filtrado e não aparecer
    status: 'published',
    duration_formatted: '0:30',
    published_at: '2026-10-11T12:00:00Z',
  },
];

describe('YouTubeEndScreenSelect Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getYoutubeVideoOptions).mockResolvedValue(mockOptions);
  });

  it('renders search input, dropdown and direct input field, excluding shorts', async () => {
    render(<YouTubeEndScreenSelect value="" onChange={vi.fn()} />);

    expect(screen.getByTestId('youtube-end-screen-container')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-related-video-search')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-related-video-select')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-related-video-input')).toBeInTheDocument();

    await waitFor(() => {
      // Vídeos longos devem aparecer
      expect(screen.getAllByText(/Como Criar um Agente de IA/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tutorial Completo de Python/i).length).toBeGreaterThan(0);
      // Shorts NÃO devem aparecer
      expect(screen.queryByText(/Shorts de 30 Segundos/i)).not.toBeInTheDocument();
    });
  });

  it('filters videos in real time when typing into search input', async () => {
    render(<YouTubeEndScreenSelect value="" onChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText(/Como Criar um Agente de IA/i).length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByTestId('youtube-related-video-search');
    // Digita "Python" no campo de busca
    fireEvent.change(searchInput, { target: { value: 'Python' } });

    // Apenas "Tutorial Completo de Python" deve permanecer visível
    expect(screen.getAllByText(/Tutorial Completo de Python/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Como Criar um Agente de IA/i)).not.toBeInTheDocument();
  });

  it('orders long videos from newest to oldest (do último vídeo publicado pra cima)', async () => {
    render(<YouTubeEndScreenSelect value="" onChange={vi.fn()} />);

    await waitFor(() => {
      // O mais recente (12/10) possui indicação "Mais recente"
      expect(screen.getAllByText(/Mais recente/i).length).toBeGreaterThan(0);
    });
  });

  it('calls onChange with selected video url when choosing an option from dropdown or card', async () => {
    const handleChange = vi.fn();
    render(<YouTubeEndScreenSelect value="" onChange={handleChange} />);

    await waitFor(() => {
      expect(screen.getAllByText(/Como Criar um Agente de IA/i).length).toBeGreaterThan(0);
    });

    const select = screen.getByTestId('youtube-related-video-select');
    fireEvent.change(select, { target: { value: 'https://www.youtube.com/watch?v=abc123xyz' } });

    expect(handleChange).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc123xyz');
  });

  it('displays preview card when a video is selected and allows removing it', async () => {
    const handleChange = vi.fn();
    render(
      <YouTubeEndScreenSelect
        value="https://www.youtube.com/watch?v=abc123xyz"
        onChange={handleChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-video-preview')).toBeInTheDocument();
    });

    const clearButton = screen.getByTitle('Remover vídeo selecionado');
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('allows typing a custom external URL directly into the input', () => {
    const handleChange = vi.fn();
    render(<YouTubeEndScreenSelect value="" onChange={handleChange} />);

    const input = screen.getByTestId('youtube-related-video-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=custom123' } });

    expect(handleChange).toHaveBeenCalledWith('https://youtube.com/watch?v=custom123');
  });
});
