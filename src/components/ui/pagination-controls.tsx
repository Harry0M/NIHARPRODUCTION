
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Current page neighborhood
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      if (pages[pages.length - 1] !== i - 1) {
        pages.push(-1); // Ellipsis indicator
      }
      pages.push(i);
    }
    
    // Last page (if not already included)
    if (totalPages > 1) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        pages.push(-1); // Ellipsis indicator
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            aria-disabled={currentPage <= 1}
          />
        </PaginationItem>

        {pageNumbers.map((pageNum, idx) => (
          pageNum === -1 ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNum}>
              <PaginationLink 
                href="#" 
                isActive={pageNum === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(pageNum);
                }}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          )
        ))}

        <PaginationItem>
          <PaginationNext 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            aria-disabled={currentPage >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
