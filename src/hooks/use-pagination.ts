import { useState } from 'react';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
}

export function usePagination({
  totalItems,
  initialPage = 1,
  itemsPerPage = 10,
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Keep currentPage within valid range
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };
  
  // Get current page items
  const getCurrentPageItems = <T>(items: T[]): T[] => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  };
  
  return {
    currentPage,
    setCurrentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    itemsPerPage,
    getCurrentPageItems,
  };
}
