import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TermsOfServicePage } from '../pages/TermsOfServicePage';

describe('TermsOfServicePage Component', () => {
  it('renders header, title, and terms sections', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByTestId('terms-of-service-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Termos de Uso da Plataforma' })
    ).toBeInTheDocument();

    expect(screen.getByText('Objeto e Descrição dos Serviços')).toBeInTheDocument();
    expect(screen.getByText('Conformidade com Diretrizes e APIs de Terceiros')).toBeInTheDocument();
    expect(screen.getByText('Responsabilidade pelo Conteúdo Publicado')).toBeInTheDocument();
    expect(screen.getByText('Disponibilidade e Dependência de Redes Externas')).toBeInTheDocument();
  });

  it('does not render back button ("Voltar ao Painel")', () => {
    render(<TermsOfServicePage />);

    expect(screen.queryByTestId('btn-back-from-terms')).not.toBeInTheDocument();
    expect(screen.queryByText(/Voltar ao Painel/i)).not.toBeInTheDocument();
  });

  it('contains navigation link to Política de Privacidade', () => {
    render(<TermsOfServicePage />);

    const privacyLinks = screen.getAllByRole('link', { name: /Política de Privacidade/i });
    expect(privacyLinks.length).toBeGreaterThanOrEqual(1);
    expect(privacyLinks[0]).toHaveAttribute('href', '/politicaprivacidade');
  });
});
