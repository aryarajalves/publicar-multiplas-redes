import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';

describe('PrivacyPolicyPage Component', () => {
  it('renders header, title, badges, and compliance sections', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByTestId('privacy-policy-page')).toBeInTheDocument();
    expect(screen.getByAltText('MultiPost Logo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();

    // Badges de conformidade
    expect(screen.getByText('Legal & LGPD')).toBeInTheDocument();
    expect(
      screen.getByText('Conformidade com a API do TikTok, YouTube, Instagram e LGPD')
    ).toBeInTheDocument();

    // Seções de escopos e dados coletados
    expect(screen.getByText('Informações e Dados que Coletamos')).toBeInTheDocument();
    expect(screen.getByText('video.publish')).toBeInTheDocument();
    expect(screen.getByText('video.upload')).toBeInTheDocument();
    expect(screen.getByText('user.info.basic')).toBeInTheDocument();

    // Seção de exclusão de dados (Data Deletion)
    expect(
      screen.getByText('Revogação de Acesso e Exclusão de Dados (Data Deletion)')
    ).toBeInTheDocument();
    expect(screen.getAllByText('suporte@multipost.com')[0]).toBeInTheDocument();
  });

  it('does not render back button ("Voltar ao Painel")', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.queryByTestId('btn-back-from-privacy')).not.toBeInTheDocument();
    expect(screen.queryByText(/Voltar ao Painel/i)).not.toBeInTheDocument();
  });

  it('contains navigation link to Termos de Uso', () => {
    render(<PrivacyPolicyPage />);

    const termsLinks = screen.getAllByRole('link', { name: /Termos de Uso/i });
    expect(termsLinks.length).toBeGreaterThanOrEqual(1);
    expect(termsLinks[0]).toHaveAttribute('href', '/termosdeuso');
  });
});
