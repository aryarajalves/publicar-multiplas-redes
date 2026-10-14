import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders "Agendado" for scheduled status', () => {
    render(<StatusBadge status="scheduled" />);
    expect(screen.getByText('Agendado')).toBeInTheDocument();
  });

  it('renders "Publicado" for published status', () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('renders "Falhou" for failed status', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Falhou')).toBeInTheDocument();
  });

  it('renders "Publicando..." for publishing status', () => {
    render(<StatusBadge status="publishing" />);
    expect(screen.getByText('Publicando...')).toBeInTheDocument();
  });

  it('renders "Cancelado" for cancelled status', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });
});
