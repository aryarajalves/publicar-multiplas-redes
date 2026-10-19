import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../components/calendar/CalendarView';
import { Post } from '../types';

const samplePosts: Post[] = [
  {
    id: 101,
    title: 'Estratégia de Vídeos Curtos',
    caption: 'Legenda do post',
    video_filename: 'short1.mp4',
    video_path: 'uploads/short1.mp4',
    status: 'scheduled',
    scheduled_at: '2026-10-15T15:30:00Z',
    created_at: '2026-10-10T12:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
    youtube_title: 'Como Crescer com Shorts no YouTube',
    publications: [
      {
        id: 1,
        post_id: 101,
        platform: 'youtube',
        status: 'pending',
        retry_count: 0,
        created_at: '2026-10-10T12:00:00Z',
        updated_at: '2026-10-10T12:00:00Z',
      },
    ],
  },
  {
    id: 102,
    title: 'Reels Viral Instagram',
    caption: 'Legenda do reels',
    video_filename: 'reels1.mp4',
    video_path: 'uploads/reels1.mp4',
    status: 'published',
    scheduled_at: '2026-10-20T18:00:00Z',
    created_at: '2026-10-10T12:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
    publications: [
      {
        id: 2,
        post_id: 102,
        platform: 'instagram',
        status: 'published',
        retry_count: 0,
        created_at: '2026-10-10T12:00:00Z',
        updated_at: '2026-10-10T12:00:00Z',
      },
    ],
  },
];

describe('CalendarView Component', () => {
  it('renders calendar header, month title and metrics cards', () => {
    render(
      <CalendarView
        posts={samplePosts}
        onSelectPost={vi.fn()}
        onOpenUpload={vi.fn()}
      />
    );

    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-header-title')).toBeInTheDocument();
    expect(screen.getByText(/Planejamento editorial e visão panorâmica/i)).toBeInTheDocument();

    // Cards de métricas
    expect(screen.getByText(/Agendados para este mês/i)).toBeInTheDocument();
    expect(screen.getByText(/Publicados com Sucesso/i)).toBeInTheDocument();
    expect(screen.getByText(/Dias com Publicações/i)).toBeInTheDocument();
  });

  it('renders posts on the corresponding date cell and opens details on click', () => {
    const handleSelectPost = vi.fn();
    render(
      <CalendarView
        posts={samplePosts}
        onSelectPost={handleSelectPost}
        onOpenUpload={vi.fn()}
      />
    );

    // O post 101 tem título YouTube 'Como Crescer com Shorts no YouTube'
    const postPill = screen.getByTestId('calendar-post-pill-101');
    expect(postPill).toBeInTheDocument();
    expect(screen.getByText('Como Crescer com Shorts no YouTube')).toBeInTheDocument();

    // Clicar no post pill deve chamar onSelectPost
    fireEvent.click(postPill);
    expect(handleSelectPost).toHaveBeenCalledTimes(1);
    expect(handleSelectPost).toHaveBeenCalledWith(samplePosts[0]);
  });

  it('calls onOpenUpload when clicking on "Novo Agendamento"', () => {
    const handleOpenUpload = vi.fn();
    render(
      <CalendarView
        posts={samplePosts}
        onSelectPost={vi.fn()}
        onOpenUpload={handleOpenUpload}
      />
    );

    const btnNew = screen.getByTestId('calendar-btn-new-post');
    fireEvent.click(btnNew);
    expect(handleOpenUpload).toHaveBeenCalledTimes(1);
  });

  it('switches between month view and week view', () => {
    render(
      <CalendarView
        posts={samplePosts}
        onSelectPost={vi.fn()}
        onOpenUpload={vi.fn()}
      />
    );

    // Inicialmente no modo mês
    const weekBtn = screen.getByTestId('view-toggle-week');
    fireEvent.click(weekBtn);

    // Deve alternar para a visão semanal
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    expect(screen.getByText('Segunda')).toBeInTheDocument();

    // Voltar para o modo mês
    const monthBtn = screen.getByTestId('view-toggle-month');
    fireEvent.click(monthBtn);
    expect(screen.getByText('Dom')).toBeInTheDocument();
    expect(screen.getByText('Seg')).toBeInTheDocument();
  });

  it('navigates next, prev and today', () => {
    render(
      <CalendarView
        posts={samplePosts}
        onSelectPost={vi.fn()}
        onOpenUpload={vi.fn()}
      />
    );

    const initialTitle = screen.getByTestId('calendar-header-title').textContent;

    // Avançar um mês
    const btnNext = screen.getByTestId('calendar-btn-next');
    fireEvent.click(btnNext);
    const nextTitle = screen.getByTestId('calendar-header-title').textContent;
    expect(nextTitle).not.toBe(initialTitle);

    // Voltar para Hoje
    const btnToday = screen.getByTestId('calendar-btn-today');
    fireEvent.click(btnToday);
    const todayTitle = screen.getByTestId('calendar-header-title').textContent;
    expect(todayTitle).toBe(initialTitle);
  });

  it('filters posts by platform', () => {
    render(
      <CalendarView
        posts={samplePosts}
        onSelectPost={vi.fn()}
        onOpenUpload={vi.fn()}
      />
    );

    // Ambos os posts visíveis inicialmente
    expect(screen.getByTestId('calendar-post-pill-101')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-post-pill-102')).toBeInTheDocument();

    // Filtrar por YouTube (só post 101 deve permanecer)
    const filterYoutube = screen.getByTestId('calendar-filter-platform-youtube');
    fireEvent.click(filterYoutube);

    expect(screen.getByTestId('calendar-post-pill-101')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-post-pill-102')).not.toBeInTheDocument();

    // Voltar para Todas
    const filterAll = screen.getByTestId('calendar-filter-platform-all');
    fireEvent.click(filterAll);

    expect(screen.getByTestId('calendar-post-pill-101')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-post-pill-102')).toBeInTheDocument();
  });
});
