import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { workItemsService } from '../api';
import { WorkItemTable } from '../components/workItems/WorkItemTable';
import { WorkItemFilters } from '../components/workItems/WorkItemFilters';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Button } from '../components/common/Button';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, RefreshCw, Layers } from 'lucide-react';

export function AllWorkItemsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter & Pagination State from URL or defaults
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    teamId: searchParams.get('teamId') || '',
    assigneeId: searchParams.get('assigneeId') || '',
    sortBy: searchParams.get('sortBy') || 'updatedAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize URL query params
  const updateUrlParams = useCallback((newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const fetchWorkItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        search: debouncedSearch,
        status: filters.status,
        priority: filters.priority,
        teamId: filters.teamId,
        assigneeId: filters.assigneeId,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        pageSize: filters.pageSize,
      };

      const res = await workItemsService.getWorkItems(queryParams);

      setItems(res?.items || []);
      setTotalItems(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      setError(err.userMessage || 'Failed to fetch work items');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.status,
    filters.priority,
    filters.teamId,
    filters.assigneeId,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.pageSize,
  ]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value, page: 1 };
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handleResetFilters = () => {
    const reset = {
      search: '',
      status: '',
      priority: '',
      teamId: '',
      assigneeId: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
    };
    setFilters(reset);
    updateUrlParams(reset);
  };

  const handleSort = (columnKey) => {
    let nextOrder = 'asc';
    if (filters.sortBy === columnKey) {
      nextOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Default desc for dates/priority
      nextOrder = columnKey === 'title' ? 'asc' : 'desc';
    }

    const updated = { ...filters, sortBy: columnKey, sortOrder: nextOrder, page: 1 };
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handlePageSizeChange = (newSize) => {
    const updated = { ...filters, pageSize: newSize, page: 1 };
    setFilters(updated);
    updateUrlParams(updated);
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">All Work Items</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational registry of incidents, escalations, tasks, and bugs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchWorkItems}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <WorkItemFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={totalItems}
      />

      {error && <ErrorAlert message={error} onRetry={fetchWorkItems} />}

      {/* Main Table or Loading / Empty States */}
      {loading ? (
        <TableSkeleton rows={filters.pageSize} cols={7} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No work items found"
          description="Try broadening your search term or resetting your active filter options."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
          secondaryActionLabel="Create Work Item"
          onSecondaryAction={() => navigate('/work-items/new')}
        />
      ) : (
        <div className="space-y-0">
          <WorkItemTable
            items={items}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
          />

          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={filters.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
