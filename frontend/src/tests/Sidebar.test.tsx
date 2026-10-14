import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar';

describe('Sidebar Component', () => {
  it('renders branding and navigation buttons correctly', () => {
    const onSelectTab = vi.fn();
    const onOpenAccounts = vi.fn();
    const onOpenTerms = vi.fn();
    const onOpenPrivacy = vi.fn();

    render(
      <Sidebar
        activeTab="posts"
        onSelectTab={onSelectTab}
        onOpenAccounts={onOpenAccounts}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
        onOpenLogout={vi.fn()}
      />
    );

    expect(screen.getByTestId('main-sidebar')).toBeInTheDocument();
    expect(screen.getByText('MultiPost')).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByText('Hub de Distribuição')).toBeInTheDocument();

    expect(screen.getByText('Operação')).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();

    expect(screen.getByTestId('sidebar-btn-posts')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-btn-users')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-btn-logs')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Logs')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-btn-backup')).toBeInTheDocument();
    expect(screen.getByText('Backup Automático')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-btn-accounts')).toBeInTheDocument();
    expect(screen.getByText('Sistema Conectado')).toBeInTheDocument();
  });

  it('triggers onSelectTab when Publicações, Gestão de Usuários, Gestão de Logs or Backup Automático is clicked', () => {
    const onSelectTab = vi.fn();

    render(
      <Sidebar
        activeTab="posts"
        onSelectTab={onSelectTab}
        onOpenAccounts={vi.fn()}
        onOpenTerms={vi.fn()}
        onOpenPrivacy={vi.fn()}
        onOpenLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('sidebar-btn-users'));
    expect(onSelectTab).toHaveBeenCalledWith('users');

    fireEvent.click(screen.getByTestId('sidebar-btn-logs'));
    expect(onSelectTab).toHaveBeenCalledWith('logs');

    fireEvent.click(screen.getByTestId('sidebar-btn-backup'));
    expect(onSelectTab).toHaveBeenCalledWith('backup');

    fireEvent.click(screen.getByTestId('sidebar-btn-posts'));
    expect(onSelectTab).toHaveBeenCalledWith('posts');
  });


  it('triggers onOpenAccounts, onOpenTerms, and onOpenPrivacy callbacks', () => {
    const onOpenAccounts = vi.fn();
    const onOpenTerms = vi.fn();
    const onOpenPrivacy = vi.fn();

    render(
      <Sidebar
        activeTab="users"
        onSelectTab={vi.fn()}
        onOpenAccounts={onOpenAccounts}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
        onOpenLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('sidebar-btn-accounts'));
    expect(onOpenAccounts).toHaveBeenCalledTimes(1);

    const termsLink = screen.getByTestId('sidebar-link-terms');
    expect(termsLink).toHaveAttribute('href', '/termosdeuso');
    expect(termsLink).toHaveAttribute('target', '_blank');
    fireEvent.click(termsLink);
    expect(onOpenTerms).toHaveBeenCalledTimes(1);

    const privacyLink = screen.getByTestId('sidebar-link-privacy');
    expect(privacyLink).toHaveAttribute('href', '/politicaprivacidade');
    expect(privacyLink).toHaveAttribute('target', '_blank');
    fireEvent.click(privacyLink);
    expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenLogout when Sair da Conta button is clicked', () => {
    const onOpenLogout = vi.fn();

    render(
      <Sidebar
        activeTab="posts"
        onSelectTab={vi.fn()}
        onOpenAccounts={vi.fn()}
        onOpenLogout={onOpenLogout}
      />
    );

    const logoutBtn = screen.getByTestId('sidebar-btn-logout');
    expect(logoutBtn).toBeInTheDocument();
    expect(screen.getByText('Sair da Conta')).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(onOpenLogout).toHaveBeenCalledTimes(1);
  });
});

