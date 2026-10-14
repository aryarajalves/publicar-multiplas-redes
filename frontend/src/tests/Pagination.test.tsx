import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../components/Pagination';

describe('Pagination Component', () => {
  it('does not render when totalItems is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalItems={0} itemsPerPage={20} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correct info when total items is 45 and page 1 (items 1 to 20)', () => {
    render(
      <Pagination currentPage={1} totalItems={45} itemsPerPage={20} onPageChange={vi.fn()} />
    );

    expect(screen.getByTestId('posts-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent(/Exibindo 1 a 20 de 45 vídeos/i);
    expect(screen.getByText('20 por página')).toBeInTheDocument();

    // Previous and first buttons must be disabled on page 1
    expect(screen.getByTestId('pagination-first')).toBeDisabled();
    expect(screen.getByTestId('pagination-prev')).toBeDisabled();

    // Next and last buttons must be enabled
    expect(screen.getByTestId('pagination-next')).not.toBeDisabled();
    expect(screen.getByTestId('pagination-last')).not.toBeDisabled();
  });

  it('renders correct info when on last page (page 3, items 41 to 45)', () => {
    render(
      <Pagination currentPage={3} totalItems={45} itemsPerPage={20} onPageChange={vi.fn()} />
    );

    expect(screen.getByTestId('pagination-info')).toHaveTextContent(/Exibindo 41 a 45 de 45 vídeos/i);

    // Next and last buttons must be disabled on page 3
    expect(screen.getByTestId('pagination-next')).toBeDisabled();
    expect(screen.getByTestId('pagination-last')).toBeDisabled();

    // Previous and first buttons must be enabled
    expect(screen.getByTestId('pagination-first')).not.toBeDisabled();
    expect(screen.getByTestId('pagination-prev')).not.toBeDisabled();
  });

  it('calls onPageChange with correct page numbers when navigation buttons are clicked', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalItems={60} itemsPerPage={20} onPageChange={handlePageChange} />
    );

    // Click Prev
    fireEvent.click(screen.getByTestId('pagination-prev'));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    // Click Next
    fireEvent.click(screen.getByTestId('pagination-next'));
    expect(handlePageChange).toHaveBeenCalledWith(3);

    // Click First
    fireEvent.click(screen.getByTestId('pagination-first'));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    // Click Last
    fireEvent.click(screen.getByTestId('pagination-last'));
    expect(handlePageChange).toHaveBeenCalledWith(3);

    // Click Page Number directly
    fireEvent.click(screen.getByTestId('pagination-page-3'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('renders intelligent ellipsis when total pages is large', () => {
    render(
      <Pagination currentPage={5} totalItems={200} itemsPerPage={20} onPageChange={vi.fn()} />
    );

    // Total pages = 10 (200 / 20)
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-4')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-5')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-6')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-10')).toBeInTheDocument();
    expect(screen.getAllByText('•••').length).toBeGreaterThanOrEqual(1);
  });
});
