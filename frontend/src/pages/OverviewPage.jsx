import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { workItemsService } from '../api';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/dashboard/MetricCard';
import { WorkItemTable } from '../components/workItems/WorkItemTable';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Button } from '../components/common/Button';
import { isOverdue } from '../utils/formatters';
import { WORK_ITEM_STATUS, WORK_ITEM_PRIORITY } from '../utils/constants';
import {
  Layers,
  UserCheck,
  AlertTriangle,
  Clock,
  FileCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export function OverviewPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'MY_OPEN' | 'HIGH_CRITICAL' | 'AWAITING_APPROVAL'

  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await workItemsService.getWorkItems({ pageSize: 50, sortBy: 'updatedAt', sortOrder: 'desc' });
      setItems(res?.items || []);
    } catch (err) {
      setError(err.userMessage || 'Failed to load operational overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Derived Metrics
  const openItems = items.filter(
    (i) => i.status !== WORK_ITEM_STATUS.RESOLVED && i.status !== WORK_ITEM_STATUS.CLOSED
  );
  const inProgressCount = items.filter((i) => i.status === WORK_ITEM_STATUS.IN_PROGRESS).length;
  const blockedCount = items.filter((i) => i.status === WORK_ITEM_STATUS.BLOCKED).length;
  const inReviewCount = items.filter((i) => i.status === WORK_ITEM_STATUS.IN_REVIEW).length;

  const myItems = items.filter(
    (i) => i.assigneeId === currentUser?.id && i.status !== WORK_ITEM_STATUS.CLOSED
  );
  const highPriorityItems = items.filter(
    (i) =>
      (i.priority === WORK_ITEM_PRIORITY.HIGH || i.priority === WORK_ITEM_PRIORITY.CRITICAL) &&
      i.status !== WORK_ITEM_STATUS.RESOLVED &&
      i.status !== WORK_ITEM_STATUS.CLOSED
  );
  const overdueItems = items.filter((i) => isOverdue(i.dueDate, i.status));
  const awaitingApprovalItems = items.filter(
    (i) => i.requiresApproval && i.approvalStatus === 'Pending'
  );

  // Quick Filter Table Data
  let filteredItems = [...items];
  if (quickFilter === 'MY_OPEN') {
    filteredItems = items.filter((i) => i.assigneeId === currentUser?.id);
  } else if (quickFilter === 'HIGH_CRITICAL') {
    filteredItems = items.filter(
      (i) => i.priority === WORK_ITEM_PRIORITY.HIGH || i.priority === WORK_ITEM_PRIORITY.CRITICAL
    );
  } else if (quickFilter === 'AWAITING_APPROVAL') {
    filteredItems = items.filter((i) => i.requiresApproval && i.approvalStatus === 'Pending');
  }

  // Display top 6 for recently updated
  const recentWorkItems = filteredItems.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header with Title and Single Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Operations Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status across incidents, system alerts, payment investigations, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchOverviewData}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchOverviewData} />}

      {/* Selective Bento-Grid for Operational KPIs */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Bento Primary Anchor: Open Work Items (Spans 2 columns on lg) */}
          <div
            onClick={() => navigate('/work-items?status=Open')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/work-items?status=Open');
              }
            }}
            className="md:col-span-2 lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-subtle hover:border-slate-300 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Active Load
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {openItems.length} Open Items
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {openItems.length}
                </div>
                <div className="p-1.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div className="p-2 rounded bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-blue-700 block uppercase">In Progress</span>
                  <span className="text-sm font-bold text-slate-800">{inProgressCount}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-rose-700 block uppercase">Blocked</span>
                  <span className="text-sm font-bold text-slate-800">{blockedCount}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] font-semibold text-purple-700 block uppercase">In Review</span>
                  <span className="text-sm font-bold text-slate-800">{inReviewCount}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-normal border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>Current operational capacity across teams</span>
              <span className="text-brand-600 font-medium text-[11px] hover:underline">View registry &rarr;</span>
            </p>
          </div>

          {/* Tile 2: Assigned to Me */}
          <MetricCard
            title="Assigned to Me"
            value={myItems.length}
            subtitle="Your active task queue"
            icon={UserCheck}
            badgeText="Direct Responsibility"
            badgeVariant="brand"
            onClick={() => navigate('/my-tasks')}
          />

          {/* Tile 3: High & Critical */}
          <MetricCard
            title="High & Critical"
            value={highPriorityItems.length}
            subtitle={highPriorityItems.length > 0 ? 'Requires immediate triage' : 'No urgent alerts'}
            icon={AlertTriangle}
            badgeText={highPriorityItems.length > 0 ? 'Urgent' : 'Nominal'}
            badgeVariant={highPriorityItems.length > 0 ? 'danger' : 'neutral'}
            onClick={() => navigate('/work-items?priority=Critical')}
          />

          {/* Tile 4: Overdue SLA */}
          <MetricCard
            title="Overdue Items"
            value={overdueItems.length}
            subtitle={overdueItems.length > 0 ? 'Target SLA date elapsed' : 'All SLAs within targets'}
            icon={Clock}
            badgeText={overdueItems.length > 0 ? 'Breached' : 'On Track'}
            badgeVariant={overdueItems.length > 0 ? 'warning' : 'neutral'}
            onClick={() => navigate('/work-items')}
          />

          {/* Tile 5: Awaiting Approval (Spans on row or aligns) */}
          <MetricCard
            title="Awaiting Approval"
            value={awaitingApprovalItems.length}
            subtitle="Dual-authorization compliance gates"
            icon={FileCheck}
            badgeText="Signoff Queue"
            badgeVariant="warning"
            onClick={() => navigate('/approvals')}
          />
        </div>
      )}

      {/* Quick Filter Segmented Control & Table */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-md text-xs border border-slate-200/80">
            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                quickFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Recently Updated
            </button>
            <button
              onClick={() => setQuickFilter('MY_OPEN')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                quickFilter === 'MY_OPEN'
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Open Tasks ({myItems.length})
            </button>
            <button
              onClick={() => setQuickFilter('HIGH_CRITICAL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                quickFilter === 'HIGH_CRITICAL'
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High & Critical Only
            </button>
            <button
              onClick={() => setQuickFilter('AWAITING_APPROVAL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                quickFilter === 'AWAITING_APPROVAL'
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Approval ({awaitingApprovalItems.length})
            </button>
          </div>

          <Link
            to="/work-items"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-end sm:self-auto"
          >
            <span>View all work items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : recentWorkItems.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-xs text-slate-500">
            No work items match the selected quick filter.
          </div>
        ) : (
          <WorkItemTable items={recentWorkItems} />
        )}
      </div>
    </div>
  );
}
