import { useState, useCallback, useRef, useEffect } from 'react';

export default function useServerPagination(fetchFn, initialFilters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const currentFilters = useRef(initialFilters);
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async (page, filters = {}) => {
    setLoading(true);
    
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await fetchFn(page, filters, abortControllerRef.current.signal);
      
      // Assume result is either an array or an object with { data, pagination: { total, totalPages } }
      if (Array.isArray(result)) {
        setData(result);
        setTotalItems(result.length);
        setTotalPages(Math.ceil(result.length / 10)); // Fallback assumes limit 10
      } else {
        setData(result.data || result.users || result.logs || []);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch error in pagination:', err);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // Expose a function to change filters and reset to page 1
  const applyFilters = useCallback((newFilters) => {
    currentFilters.current = newFilters;
    setCurrentPage(1);
    loadData(1, newFilters);
  }, [loadData]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    loadData(newPage, currentFilters.current);
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData(1, currentFilters.current);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  return {
    data,
    setData,
    loading,
    currentPage,
    totalItems,
    totalPages,
    handlePageChange,
    applyFilters,
    refresh: () => loadData(currentPage, currentFilters.current)
  };
}
