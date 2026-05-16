import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      <div className="text-sm text-[color:var(--color-text-soft)]">
        Menampilkan <span className="font-semibold text-[color:var(--color-heading)]">{startItem}</span> - <span className="font-semibold text-[color:var(--color-heading)]">{endItem}</span> dari <span className="font-semibold text-[color:var(--color-heading)]">{totalItems}</span> data
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border p-1 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center gap-1 mx-2">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-[color:var(--color-text-soft)]">...</span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === page 
                      ? 'bg-djp-blue text-white shadow-sm' 
                      : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg border p-1 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
