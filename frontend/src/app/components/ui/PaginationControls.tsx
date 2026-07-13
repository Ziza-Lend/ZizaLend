"use client";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  summary?: string;
  className?: string;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    return Array.from({ length: 5 }, (_, index) => totalPages - 4 + index);
  }

  return Array.from({ length: 5 }, (_, index) => currentPage - 2 + index);
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  onPrevious,
  onNext,
  summary,
  className = "",
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <div className="text-sm text-[var(--text-secondary)]">{summary}</div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="h-10 w-10 rounded-full border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)]"
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-1 text-[var(--text-muted)]">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}              className={`h-10 w-10 rounded-full text-sm font-medium transition ${
              currentPage === page
                ? "bg-violet-600 text-white"
                : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-[var(--text-muted)]">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="h-10 w-10 rounded-full border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)]"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
