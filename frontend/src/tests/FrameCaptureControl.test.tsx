import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrameCaptureControl } from '../components/upload/FrameCaptureControl';

describe('FrameCaptureControl Component', () => {
  const mockOnCaptureFrame = vi.fn();
  const mockOnRemoveFrame = vi.fn();
  const mockOnApplyVertical = vi.fn();
  const mockOnApplyHorizontal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders capture button', () => {
    const videoRef = {
      current: {
        videoWidth: 1080,
        videoHeight: 1920,
        currentTime: 12.5,
        paused: true,
        pause: vi.fn(),
      } as unknown as HTMLVideoElement,
    };

    render(
      <FrameCaptureControl
        videoRef={videoRef}
        capturedFrame={null}
        capturedFramePreview={null}
        capturedFrameTime={null}
        onCaptureFrame={mockOnCaptureFrame}
        onRemoveFrame={mockOnRemoveFrame}
        onApplyToVertical={mockOnApplyVertical}
        onApplyToHorizontal={mockOnApplyHorizontal}
      />
    );

    const captureBtn = screen.getByTestId('btn-capture-video-frame');
    expect(captureBtn).toBeInTheDocument();
    expect(captureBtn).toHaveTextContent(/Capturar Frame Atual/i);
  });

  it('triggers canvas capture when capture button is clicked', () => {
    const mockDrawImage = vi.fn();
    const mockToBlob = vi.fn((callback) => {
      const blob = new Blob(['fake-img'], { type: 'image/jpeg' });
      callback(blob);
    });

    // Mock HTMLCanvasElement
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage: mockDrawImage,
          }),
          toBlob: mockToBlob,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/captured-frame');
    URL.createObjectURL = mockCreateObjectURL;

    const videoRef = {
      current: {
        videoWidth: 1920,
        videoHeight: 1080,
        currentTime: 45,
        paused: true,
        pause: vi.fn(),
      } as unknown as HTMLVideoElement,
    };

    render(
      <FrameCaptureControl
        videoRef={videoRef}
        capturedFrame={null}
        capturedFramePreview={null}
        capturedFrameTime={null}
        onCaptureFrame={mockOnCaptureFrame}
        onRemoveFrame={mockOnRemoveFrame}
        onApplyToVertical={mockOnApplyVertical}
        onApplyToHorizontal={mockOnApplyHorizontal}
      />
    );

    const captureBtn = screen.getByTestId('btn-capture-video-frame');
    fireEvent.click(captureBtn);

    expect(mockDrawImage).toHaveBeenCalled();
    expect(mockToBlob).toHaveBeenCalled();
    expect(mockOnCaptureFrame).toHaveBeenCalledWith(
      expect.any(File),
      'blob:http://localhost/captured-frame',
      45
    );
  });

  it('displays captured frame card with timestamp, preview and action buttons', () => {
    const fakeFile = new File(['frame'], 'frame_00_15.jpg', { type: 'image/jpeg' });
    const videoRef = { current: null };

    render(
      <FrameCaptureControl
        videoRef={videoRef}
        capturedFrame={fakeFile}
        capturedFramePreview="blob:http://localhost/frame-preview-123"
        capturedFrameTime={75} // 01:15
        onCaptureFrame={mockOnCaptureFrame}
        onRemoveFrame={mockOnRemoveFrame}
        onApplyToVertical={mockOnApplyVertical}
        onApplyToHorizontal={mockOnApplyHorizontal}
      />
    );

    const card = screen.getByTestId('captured-frame-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByTestId('captured-frame-time')).toHaveTextContent('01:15');

    const previewImg = screen.getByTestId('captured-frame-preview-img');
    expect(previewImg).toHaveAttribute('src', 'blob:http://localhost/frame-preview-123');

    // Test apply buttons
    const applyVertBtn = screen.getByTestId('btn-apply-frame-vertical');
    fireEvent.click(applyVertBtn);
    expect(mockOnApplyVertical).toHaveBeenCalledTimes(1);

    const applyHorizBtn = screen.getByTestId('btn-apply-frame-horizontal');
    fireEvent.click(applyHorizBtn);
    expect(mockOnApplyHorizontal).toHaveBeenCalledTimes(1);

    // Test remove button
    const removeBtn = screen.getByTestId('btn-remove-captured-frame');
    fireEvent.click(removeBtn);
    expect(mockOnRemoveFrame).toHaveBeenCalledTimes(1);
  });
});
