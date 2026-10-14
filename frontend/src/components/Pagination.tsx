import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
  testId?: string;
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  isLoading = false,
  itemLabel = 'vídeos',
  testId = 'posts-pagination',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Gera a lista de páginas com reticências inteligentes
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      data-testid={testId}
      className="mt-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in"
    >
      {/* Informações de Exibição */}
      <div className="flex items-center gap-2.5 text-xs text-slate-500">
        <span
          data-testid="pagination-info"
          className="font-medium text-slate-600"
        >
          Exibindo <strong className="text-slate-900 font-semibold">{startItem}</strong> a <strong className="text-slate-900 font-semibold">{endItem}</strong> de <strong className="text-slate-900 font-semibold">{totalItems}</strong> {itemLabel}
        </span>
        <span className="hidden sm:inline-block text-slate-300">•</span>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
          {itemsPerPage} por página
        </span>
      </div>

      {/* Controles de Navegação */}
      <div className="flex items-center gap-1.5">
        {/* Primeira Página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          data-testid="pagination-first"
          title="Primeira página"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          data-testid="pagination-prev"
          title="Página anterior"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Números das Páginas */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, index) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-slate-400 text-xs select-none"
                >
                  •••
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                data-testid={`pagination-page-${pageNum}`}
                className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#ea384c] text-white shadow-sm ring-1 ring-red-400 scale-105'
                    : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Próxima Página */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          data-testid="pagination-next"
          title="Próxima página"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última Página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          data-testid="pagination-last"
          title="Última página"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
