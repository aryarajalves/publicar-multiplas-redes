import React from 'react';
import { Search, Filter, Instagram, Youtube, Video } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  platform: string;
  onPlatformChange: (value: string) => void;
}

export const PostFilters: React.FC<Props> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  platform,
  onPlatformChange,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título ou legenda..."
          data-testid="search-input"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            data-testid="status-select"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="">Todos os Status</option>
            <option value="scheduled">Agendados</option>
            <option value="published">Publicados</option>
            <option value="publishing">Publicando</option>
            <option value="failed">Falhas</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        {/* Platform Buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => onPlatformChange('')}
            className={`px-3 py-1 rounded-md transition-colors ${
              platform === '' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => onPlatformChange('instagram')}
            data-testid="filter-platform-instagram"
            className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
              platform === 'instagram' ? 'bg-pink-600 text-white font-medium' : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </button>
          <button
            onClick={() => onPlatformChange('youtube')}
            data-testid="filter-platform-youtube"
            className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
              platform === 'youtube' ? 'bg-red-600 text-white font-medium' : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube</span>
          </button>
          <button
            onClick={() => onPlatformChange('tiktok')}
            data-testid="filter-platform-tiktok"
            className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
              platform === 'tiktok' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>TikTok</span>
          </button>
        </div>
      </div>
    </div>
  );
};
