import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkCoverSelector } from '../components/upload/NetworkCoverSelector';

describe('NetworkCoverSelector Component', () => {
  const mockOnChangeSource = vi.fn();
  const mockOnGoToMediaTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for YouTube with options', () => {
    render(
      <NetworkCoverSelector
        platformName="YouTube"
        platform="youtube"
        selectedSource="auto"
        onChangeSource={mockOnChangeSource}
        verticalThumbnailPreview={null}
        horizontalThumbnailPreview={null}
        capturedFramePreview={null}
        capturedFrameTime={null}
        onGoToMediaTab={mockOnGoToMediaTab}
      />
    );

    expect(screen.getByTestId('cover-selector-youtube')).toBeInTheDocument();
    expect(screen.getByTestId('opt-cover-auto-youtube')).toBeInTheDocument();
    expect(screen.getByTestId('opt-cover-thumb-youtube')).toBeInTheDocument();
    expect(screen.getByTestId('opt-cover-frame-youtube')).toBeInTheDocument();
  });

  it('renders correctly for Instagram with thumbnail uploaded', () => {
    render(
      <NetworkCoverSelector
        platformName="Instagram Reels"
        platform="instagram"
        selectedSource="thumbnail"
        onChangeSource={mockOnChangeSource}
        verticalThumbnailPreview="blob:http://localhost/thumb-inst.png"
        horizontalThumbnailPreview={null}
        capturedFramePreview={null}
        capturedFrameTime={null}
        onGoToMediaTab={mockOnGoToMediaTab}
      />
    );

    expect(screen.getByTestId('cover-selector-instagram')).toBeInTheDocument();
    expect(screen.getByText('Personalizada')).toBeInTheDocument();
    expect(screen.getByTestId('opt-cover-thumb-instagram')).toBeInTheDocument();
    expect(screen.getByText('9:16 Vertical')).toBeInTheDocument();
  });

  it('calls onChangeSource when clicking options with previews available', () => {
    render(
      <NetworkCoverSelector
        platformName="TikTok"
        platform="tiktok"
        selectedSource="auto"
        onChangeSource={mockOnChangeSource}
        verticalThumbnailPreview="blob:http://localhost/thumb.png"
        horizontalThumbnailPreview={null}
        capturedFramePreview="blob:http://localhost/frame.jpg"
        capturedFrameTime={42}
        onGoToMediaTab={mockOnGoToMediaTab}
      />
    );

    // Clica na opção de Frame
    fireEvent.click(screen.getByTestId('opt-cover-frame-tiktok'));
    expect(mockOnChangeSource).toHaveBeenCalledWith('frame');

    // Clica na opção de Thumbnail
    fireEvent.click(screen.getByTestId('opt-cover-thumb-tiktok'));
    expect(mockOnChangeSource).toHaveBeenCalledWith('thumbnail');

    // Clica na opção Auto
    fireEvent.click(screen.getByTestId('opt-cover-auto-tiktok'));
    expect(mockOnChangeSource).toHaveBeenCalledWith('auto');
  });

  it('triggers onGoToMediaTab when clicking uncaptured frame option', () => {
    render(
      <NetworkCoverSelector
        platformName="YouTube"
        platform="youtube"
        selectedSource="auto"
        onChangeSource={mockOnChangeSource}
        verticalThumbnailPreview={null}
        horizontalThumbnailPreview={null}
        capturedFramePreview={null}
        capturedFrameTime={null}
        onGoToMediaTab={mockOnGoToMediaTab}
      />
    );

    // Clica na opção de Frame que não tem frame capturado
    fireEvent.click(screen.getByTestId('opt-cover-frame-youtube'));
    expect(mockOnGoToMediaTab).toHaveBeenCalledTimes(1);
  });
});
