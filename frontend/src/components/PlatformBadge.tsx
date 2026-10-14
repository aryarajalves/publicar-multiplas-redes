import React from 'react';
import { PlatformType, PublicationStatus } from '../types';
import { Instagram, Youtube, Video, Check, AlertCircle, Clock } from 'lucide-react';

interface Props {
  platform: PlatformType | string;
  status?: PublicationStatus | string;
  showStatusIcon?: boolean;
  videoType?: string | null;
}

export const PlatformBadge: React.FC<Props> = ({
  platform,
  status,
  showStatusIcon = false,
  videoType,
}) => {
  const plat = platform.toLowerCase();

  let name = 'Instagram';
  let badgeClasses = 'bg-pink-50 text-pink-700 border-pink-200';
  let Icon = Instagram;

  if (plat === 'youtube') {
    const isShorts = !videoType || videoType.toLowerCase().includes('short');
    name = isShorts ? 'YouTube Shorts' : 'YouTube Vídeo Longo';
    badgeClasses = 'bg-red-50 text-red-700 border-red-200';
    Icon = Youtube;
  } else if (plat === 'tiktok') {
    name = 'TikTok';
    badgeClasses = 'bg-slate-100 text-slate-800 border-slate-200';
    Icon = Video;
  }

  return (
    <span
      data-testid={`platform-badge-${plat}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badgeClasses}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{name}</span>
      {showStatusIcon && status && (
        <span className="ml-0.5">
          {status === 'published' && <Check className="w-3 h-3 text-emerald-400 inline" />}
          {status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-400 inline" />}
          {(status === 'pending' || status === 'in_progress') && (
            <Clock className="w-3 h-3 text-blue-400 inline" />
          )}
        </span>
      )}
    </span>
  );
};
