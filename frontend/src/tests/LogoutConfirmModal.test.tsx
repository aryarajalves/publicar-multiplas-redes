import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';

describe('LogoutConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <LogoutConfirmModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and texts when isOpen is true', () => {
    render(
      <LogoutConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />
    );

    expect(screen.getByTestId('logout-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('logout-modal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Encerrar Sessão?')).toBeInTheDocument();
    expect(screen.getByText(/Você tem certeza que deseja sair do painel/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel-logout')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm-logout')).toBeInTheDocument();
    expect(screen.getByTestId('btn-close-logout-modal')).toBeInTheDocument();
  });

  it('calls onClose when clicking cancel button or X button', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <LogoutConfirmModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('btn-cancel-logout'));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <LogoutConfirmModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('btn-close-logout-modal'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when clicking confirm button', () => {
    const onConfirm = vi.fn();
    render(
      <LogoutConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByTestId('btn-confirm-logout'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isLoading is true', () => {
    render(
      <LogoutConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('btn-confirm-logout')).toBeDisabled();
    expect(screen.getByTestId('btn-cancel-logout')).toBeDisabled();
    expect(screen.getByTestId('btn-close-logout-modal')).toBeDisabled();
  });
});
