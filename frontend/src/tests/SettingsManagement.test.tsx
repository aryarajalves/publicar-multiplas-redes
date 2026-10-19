import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsManagement } from '../components/settings/SettingsManagement';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getPublicationSettings: vi.fn(),
    updatePublicationSettings: vi.fn(),
    searchLocations: vi.fn(),
  },
}));

describe('SettingsManagement Component', () => {
  const mockSettings = {
    id: 1,
    default_location_name: 'São Paulo, SP, Brasil',
    default_location_id: '111524315534407',
    tiktok_location_hashtags: '#SaoPaulo #SP #Brasil',
    youtube_location_name: 'São Paulo, SP, Brasil',
    apply_location_to_all: true,
    updated_at: '2026-10-17T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getPublicationSettings as any).mockResolvedValue(mockSettings);
    (api.searchLocations as any).mockResolvedValue({
      results: [
        {
          name: 'Curitiba, PR, Brasil',
          city: 'Curitiba',
          state: 'PR',
          place_id: '108347892523293',
          hashtags: '#Curitiba #CWB #PR',
        },
      ],
    });
    (api.updatePublicationSettings as any).mockResolvedValue({
      ...mockSettings,
      default_location_name: 'Curitiba, PR, Brasil',
      default_location_id: '108347892523293',
    });
  });

  it('renders loading state and then loads settings', async () => {
    render(<SettingsManagement />);

    expect(screen.getByText(/Carregando configurações do sistema.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('settings-management-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('input-location-search')).toHaveValue('São Paulo, SP, Brasil');
    expect(screen.getByTestId('input-instagram-place-id')).toHaveValue('111524315534407');
    expect(screen.getByTestId('input-tiktok-hashtags')).toHaveValue('#SaoPaulo #SP #Brasil');
    expect(screen.getByTestId('input-youtube-location')).toHaveValue('São Paulo, SP, Brasil');
  });

  it('searches for location and updates fields when a suggestion is clicked', async () => {
    render(<SettingsManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('input-location-search')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('input-location-search');
    fireEvent.change(searchInput, { target: { value: 'Curitiba' } });

    await waitFor(() => {
      expect(api.searchLocations).toHaveBeenCalledWith('Curitiba');
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
    });

    const option = screen.getByTestId('location-option-0');
    fireEvent.click(option);

    expect(screen.getByText(/Localização 'Curitiba' selecionada!/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('108347892523293')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#Curitiba #CWB #PR')).toBeInTheDocument();
  });

  it('toggles apply_location_to_all and saves settings with success banner', async () => {
    render(<SettingsManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-apply-location')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('toggle-apply-location') as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);

    const saveButton = screen.getByTestId('btn-save-settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.updatePublicationSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          apply_location_to_all: false,
        })
      );
      expect(screen.getByText(/Configurações salvas com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('displays error banner when updating settings fails', async () => {
    (api.updatePublicationSettings as any).mockRejectedValueOnce({
      response: { data: { detail: 'Falha ao salvar preferências no servidor.' } }
    });

    render(<SettingsManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-save-settings')).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId('btn-save-settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Falha ao salvar preferências no servidor./i)).toBeInTheDocument();
    });
  });
});
