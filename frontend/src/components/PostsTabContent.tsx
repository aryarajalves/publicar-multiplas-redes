import React from 'react';
import { Post, PlatformOverview } from '../types';
import { OverviewStats } from './OverviewStats';
import { PostFilters } from './PostFilters';
import { PostCard } from './PostCard';
import { Pagination } from './Pagination';
import { AlertCircle, Film, PlusCircle } from 'lucide-react';

interface Props {
  error: string | null;
  overview: PlatformOverview | null;
  posts: Post[];
  totalPosts: number;
  page: number;
  itemsPerPage: number;
  search: string;
  status: string;
  platform: string;
  isLoading: boolean;
  onRefresh: () => void;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onPlatformChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onViewDetails: (post: Post) => void;
  onPublishNow: (post: Post) => void;
  onDelete: (post: Post) => void;
  onOpenUpload: () => void;
}

export const PostsTabContent: React.FC<Props> = ({
  error,
  overview,
  posts,
  totalPosts,
  page,
  itemsPerPage,
  search,
  status,
  platform,
  isLoading,
  onRefresh,
  onSearchChange,
  onStatusChange,
  onPlatformChange,
  onPageChange,
  onViewDetails,
  onPublishNow,
  onDelete,
  onOpenUpload,
}) => {
  return (
    <>
      {/* Banner de Erro de Conexão */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 transition-colors shadow-2xs cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Estatísticas Gerais */}
      <OverviewStats overview={overview} />

      {/* Barra de Filtros e Busca */}
      <PostFilters
        search={search}
        onSearchChange={onSearchChange}
        status={status}
        onStatusChange={onStatusChange}
        platform={platform}
        onPlatformChange={onPlatformChange}
      />

      {/* Listagem de Posts / Vídeos */}
      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onViewDetails={onViewDetails}
                onPublishNow={onPublishNow}
                onDelete={onDelete}
              />
            ))}
          </div>

          {/* Componente de Paginação Otimizada */}
          <Pagination
            currentPage={page}
            totalItems={totalPosts}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            isLoading={isLoading}
          />
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Nenhuma publicação encontrada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            {search || status || platform
              ? 'Nenhum vídeo corresponde aos filtros selecionados. Tente ajustar a busca.'
              : 'Comece agendando seu primeiro vídeo para o Instagram com cross-posting para YouTube e TikTok!'}
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ea384c] hover:bg-[#d82a3e] text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Primeiro Vídeo</span>
          </button>
        </div>
      )}
    </>
  );
};
