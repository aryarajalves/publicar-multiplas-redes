import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../components/TermsOfServiceModal';

describe('Legal Modals (Privacy & Terms)', () => {
  it('renders PrivacyPolicyModal correctly when open and handles close', () => {
    const handleClose = vi.fn();
    const { rerender } = render(<PrivacyPolicyModal isOpen={false} onClose={handleClose} />);
    expect(screen.queryByTestId('privacy-policy-modal')).not.toBeInTheDocument();

    rerender(<PrivacyPolicyModal isOpen={true} onClose={handleClose} />);
    expect(screen.getByTestId('privacy-policy-modal')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    expect(screen.getByText(/Informações que Coletamos/i)).toBeInTheDocument();
    expect(screen.getByText(/Não Compartilhamento e Privacidade/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-close-privacy-modal'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders TermsOfServiceModal correctly when open and handles close', () => {
    const handleClose = vi.fn();
    const { rerender } = render(<TermsOfServiceModal isOpen={false} onClose={handleClose} />);
    expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();

    rerender(<TermsOfServiceModal isOpen={true} onClose={handleClose} />);
    expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
    expect(screen.getByText(/Conformidade com Plataformas Parceiras/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-close-terms-modal'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
