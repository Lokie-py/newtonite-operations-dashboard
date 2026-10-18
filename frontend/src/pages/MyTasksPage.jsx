import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { workItemsService } from '../api';
import { useAuth } from '../context/AuthContext';
import { WorkItemTable } from '../components/workItems/WorkItemTable';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Button } from '../components/common/Button';
import { CheckCircle, Filter, Plus, RefreshCw } from 'lucide-react';
import { WORK_ITEM_STATUS } from '../utils/constants';

export function MyTasksPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchMyTasks = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const res = await workItemsService.getWorkItems({
        assigneeId: currentUser.id,
        status: statusFilter,
        sortBy,
        sortOrder,
        pageSize: 50,
      });
      setItems(res?.items || []);
    } catch (err) {
      setError(err.userMessage || 'Failed to fetch personal tasks');
    } finally {
      setLoading(false);
    }
  }, [currentUser, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Tasks</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Work items directly assigned to {currentUser?.name || 'you'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchMyTasks}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          >
            <option value="">All Statuses ({items.length})</option>
            {Object.values(WORK_ITEM_STATUS).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{items.length}</strong> assigned items
        </span>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchMyTasks} />}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All caught up!"
          description="You have no tasks assigned with the selected criteria."
          actionLabel="View All Work Items"
          onAction={() => navigate('/work-items')}
        />
      ) : (
        <WorkItemTable
          items={items}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
