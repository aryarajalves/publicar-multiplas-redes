import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstagramTrialReelsSelector } from '../components/upload/InstagramTrialReelsSelector';
import { InstagramMusicSelector } from '../components/upload/InstagramMusicSelector';
import { UploadModalHeader } from '../components/upload/UploadModalHeader';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getInstagramProfile: vi.fn(),
    searchInstagramAudio: vi.fn(),
    getFavoriteInstagramAudio: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    addFavoriteInstagramAudio: vi.fn().mockResolvedValue({ is_favorite: true }),
    removeFavoriteInstagramAudio: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Instagram Trial Reels, Music Selector & Top-Right Profile Badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o @ do Instagram e a quantidade de seguidores no canto superior direito do UploadModalHeader', () => {
    render(
      <UploadModalHeader
        onClose={vi.fn()}
        isSubmitting={false}
        igProfile={{
          connected: true,
          username: 'focoauto.aryaraj',
          account_name: '@focoauto.aryaraj',
          followers_count: 63,
          media_count: 2,
          trial_reels_eligible: false,
          min_followers_for_trial: 1000,
        }}
      />
    );

    expect(screen.getByTestId('modal-header-ig-badge')).toBeInTheDocument();
    expect(screen.getByTestId('modal-header-ig-username')).toHaveTextContent('@focoauto.aryaraj');
    expect(screen.getByTestId('modal-header-ig-followers')).toHaveTextContent('63 seguidores');
  });

  it('bloqueia o Reels de Teste quando a conta tem menos de 1.000 seguidores e exibe o aviso de restrição', () => {
    const setIsTrialReel = vi.fn();
    render(
      <InstagramTrialReelsSelector
        igProfile={{
          connected: true,
          username: 'focoauto.aryaraj',
          account_name: '@focoauto.aryaraj',
          followers_count: 63,
          media_count: 2,
          trial_reels_eligible: false,
          min_followers_for_trial: 1000,
        }}
        isTrialReel={false}
        setIsTrialReel={setIsTrialReel}
        graduationStrategy="MANUAL"
        setGraduationStrategy={vi.fn()}
      />
    );

    expect(screen.getByTestId('trial-card-ig-username')).toHaveTextContent('@focoauto.aryaraj');
    expect(screen.getByTestId('trial-card-ig-followers')).toHaveTextContent('63 seguidores');
    expect(screen.getByTestId('trial-reels-restriction-banner')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-trial-reel')).toBeDisabled();
  });

  it('permite ativar o Reels de Teste e escolher a estratégia quando a conta tem >= 1.000 seguidores', () => {
    const setIsTrialReel = vi.fn();
    const setGraduationStrategy = vi.fn();

    render(
      <InstagramTrialReelsSelector
        igProfile={{
          connected: true,
          username: 'focoauto.aryaraj',
          account_name: '@focoauto.aryaraj',
          followers_count: 1500,
          media_count: 20,
          trial_reels_eligible: true,
          min_followers_for_trial: 1000,
        }}
        isTrialReel={true}
        setIsTrialReel={setIsTrialReel}
        graduationStrategy="MANUAL"
        setGraduationStrategy={setGraduationStrategy}
      />
    );

    const toggleBtn = screen.getByTestId('toggle-trial-reel');
    expect(toggleBtn).not.toBeDisabled();
    expect(screen.getByTestId('trial-graduation-strategy-box')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-strategy-performance'));
    expect(setGraduationStrategy).toHaveBeenCalledWith('SS_PERFORMANCE');
  });

  it('lista músicas do catálogo do Instagram, permite selecionar uma faixa e ajustar volumes', async () => {
    (api.searchInstagramAudio as any).mockResolvedValue({
      total: 1,
      source: 'meta_graph_api',
      items: [
        {
          audio_id: '1120932070383283',
          title: 'Blue Moon',
          display_artist: 'Zara Larsson',
          duration_in_ms: 177544,
          audio_type: 'music',
        },
      ],
    });

    const onSelectAudio = vi.fn();
    const setAudioVolume = vi.fn();
    const setVideoVolume = vi.fn();

    render(
      <InstagramMusicSelector
        selectedAudio={{
          audio_id: '1120932070383283',
          title: 'Blue Moon',
          display_artist: 'Zara Larsson',
          duration_in_ms: 177544,
          audio_type: 'music',
        }}
        onSelectAudio={onSelectAudio}
        audioVolume={80}
        setAudioVolume={setAudioVolume}
        videoVolume={50}
        setVideoVolume={setVideoVolume}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ig-music-item-1120932070383283')).toBeInTheDocument();
    });

    expect(screen.getByTestId('selected-ig-music-title')).toHaveTextContent('Blue Moon');
    expect(screen.getByTestId('btn-play-selected-ig-music')).toHaveTextContent('Ouvir');
    expect(screen.getByTestId('btn-audio-type-favorites')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-favorite-audio-1120932070383283'));
    expect(api.addFavoriteInstagramAudio).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('slider-ig-audio-volume'), { target: { value: '95' } });
    expect(setAudioVolume).toHaveBeenCalledWith(95);
  });
});
