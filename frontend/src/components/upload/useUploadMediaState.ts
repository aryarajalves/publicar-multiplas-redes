import React, { useState, useRef, useEffect } from 'react';
import { CoverSourceType } from './NetworkCoverSelector';

export function useUploadMediaState(
  title: string,
  setTitle: (val: string) => void,
  youtubeTitle: string,
  setYoutubeTitle: (val: string) => void
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [verticalThumbnail, setVerticalThumbnail] = useState<File | null>(null);
  const [verticalThumbnailPreview, setVerticalThumbnailPreview] = useState<string | null>(null);
  const verticalThumbInputRef = useRef<HTMLInputElement>(null);

  const [horizontalThumbnail, setHorizontalThumbnail] = useState<File | null>(null);
  const [horizontalThumbnailPreview, setHorizontalThumbnailPreview] = useState<string | null>(null);
  const horizontalThumbInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedFrame, setCapturedFrame] = useState<File | null>(null);
  const [capturedFramePreview, setCapturedFramePreview] = useState<string | null>(null);
  const [capturedFrameTime, setCapturedFrameTime] = useState<number | null>(null);

  const [youtubeCoverSource, setYoutubeCoverSource] = useState<CoverSourceType>('auto');
  const [instagramCoverSource, setInstagramCoverSource] = useState<CoverSourceType>('auto');
  const [tiktokCoverSource, setTiktokCoverSource] = useState<CoverSourceType>('auto');

  const safeRevoke = (url: string | null) => {
    if (
      url &&
      typeof url === 'string' &&
      url.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  };

  const activeBlobsRef = useRef<Set<string>>(new Set());
  const trackBlob = (url: string | null) => {
    if (url && url.startsWith('blob:')) activeBlobsRef.current.add(url);
  };

  useEffect(() => {
    return () => {
      activeBlobsRef.current.forEach((b) => safeRevoke(b));
      activeBlobsRef.current.clear();
    };
  }, []);

  const handleCaptureFrame = (frameFile: File, framePreviewUrl: string, timeSec: number) => {
    if (capturedFramePreview && capturedFramePreview !== framePreviewUrl) safeRevoke(capturedFramePreview);
    trackBlob(framePreviewUrl);
    setCapturedFrame(frameFile);
    setCapturedFramePreview(framePreviewUrl);
    setCapturedFrameTime(timeSec);
    if (youtubeCoverSource === 'auto') setYoutubeCoverSource('frame');
    if (instagramCoverSource === 'auto') setInstagramCoverSource('frame');
    if (tiktokCoverSource === 'auto') setTiktokCoverSource('frame');
  };

  const handleRemoveCapturedFrame = () => {
    safeRevoke(capturedFramePreview);
    setCapturedFrame(null);
    setCapturedFramePreview(null);
    setCapturedFrameTime(null);
    if (youtubeCoverSource === 'frame') setYoutubeCoverSource(horizontalThumbnail ? 'thumbnail' : 'auto');
    if (instagramCoverSource === 'frame') setInstagramCoverSource(verticalThumbnail ? 'thumbnail' : 'auto');
    if (tiktokCoverSource === 'frame') setTiktokCoverSource(verticalThumbnail ? 'thumbnail' : 'auto');
  };

  const handleApplyFrameToVertical = () => {
    if (!capturedFrame) return;
    safeRevoke(verticalThumbnailPreview);
    setVerticalThumbnail(capturedFrame);
    setVerticalThumbnailPreview(capturedFramePreview);
    setInstagramCoverSource('frame');
    setTiktokCoverSource('frame');
  };

  const handleApplyFrameToHorizontal = () => {
    if (!capturedFrame) return;
    safeRevoke(horizontalThumbnailPreview);
    setHorizontalThumbnail(capturedFrame);
    setHorizontalThumbnailPreview(capturedFramePreview);
    setYoutubeCoverSource('frame');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      trackBlob(url);
      setPreviewUrl(url);
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, '');
      if (!title) setTitle(nameWithoutExt);
      if (!youtubeTitle) setYoutubeTitle(nameWithoutExt);
    }
  };

  const handleVerticalThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      safeRevoke(verticalThumbnailPreview);
      const url = URL.createObjectURL(selected);
      trackBlob(url);
      setVerticalThumbnail(selected);
      setVerticalThumbnailPreview(url);
      setInstagramCoverSource('thumbnail');
      setTiktokCoverSource('thumbnail');
    }
  };

  const handleRemoveVerticalThumb = () => {
    safeRevoke(verticalThumbnailPreview);
    setVerticalThumbnail(null);
    setVerticalThumbnailPreview(null);
    if (verticalThumbInputRef.current) verticalThumbInputRef.current.value = '';
    if (instagramCoverSource === 'thumbnail') setInstagramCoverSource(capturedFrame ? 'frame' : 'auto');
    if (tiktokCoverSource === 'thumbnail') setTiktokCoverSource(capturedFrame ? 'frame' : 'auto');
  };

  const handleHorizontalThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      safeRevoke(horizontalThumbnailPreview);
      const url = URL.createObjectURL(selected);
      trackBlob(url);
      setHorizontalThumbnail(selected);
      setHorizontalThumbnailPreview(url);
      setYoutubeCoverSource('thumbnail');
    }
  };

  const handleRemoveHorizontalThumb = () => {
    safeRevoke(horizontalThumbnailPreview);
    setHorizontalThumbnail(null);
    setHorizontalThumbnailPreview(null);
    if (horizontalThumbInputRef.current) horizontalThumbInputRef.current.value = '';
    if (youtubeCoverSource === 'thumbnail') setYoutubeCoverSource(capturedFrame ? 'frame' : 'auto');
  };

  return {
    fileInputRef,
    file,
    previewUrl,
    verticalThumbnail,
    verticalThumbnailPreview,
    verticalThumbInputRef,
    horizontalThumbnail,
    horizontalThumbnailPreview,
    horizontalThumbInputRef,
    videoRef,
    capturedFrame,
    capturedFramePreview,
    capturedFrameTime,
    youtubeCoverSource,
    setYoutubeCoverSource,
    instagramCoverSource,
    setInstagramCoverSource,
    tiktokCoverSource,
    setTiktokCoverSource,
    handleCaptureFrame,
    handleRemoveCapturedFrame,
    handleApplyFrameToVertical,
    handleApplyFrameToHorizontal,
    handleFileChange,
    handleVerticalThumbChange,
    handleRemoveVerticalThumb,
    handleHorizontalThumbChange,
    handleRemoveHorizontalThumb,
  };
}
