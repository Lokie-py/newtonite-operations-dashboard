import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { activityService } from "../api";
import { TableSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { Button } from "../components/common/Button";
import {
  formatDateTime,
  formatRelativeTime,
  getInitials,
} from "../utils/formatters";
import { History, RefreshCw, RotateCcw } from "lucide-react";

const ACTION_LABELS = {
  work_item_created: "Item Created",
  work_item_updated: "Work Item Updated",
  approval_requested: "Approval Requested",
  approval_decided: "Approval Decided",
  comment_added: "Comment Added",
};

const formatAction = (action) =>
  ACTION_LABELS[action] ||
  String(action || "Unknown Action")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDetails = (details) => {
  if (details == null) return "—";

  if (typeof details === "string") return details;

  if (typeof details !== "object") return String(details);

  const parts = [];

  if (Array.isArray(details.changed_fields) && details.changed_fields.length) {
    parts.push(
      `Changed: ${details.changed_fields
        .map((field) => field.replaceAll("_", " "))
        .join(", ")}`,
    );
  }

  if (details.title) parts.push(`Title: ${details.title}`);
  if (details.status) parts.push(`Status: ${details.status}`);
  if (details.priority) parts.push(`Priority: ${details.priority}`);

  if (details.previous_version !== undefined) {
    parts.push(`Version ${details.previous_version} → ${details.new_version}`);
  }

  if (details.reviewer_id !== undefined) {
    parts.push(`Reviewer ID: ${details.reviewer_id}`);
  }

  if (details.approval_id !== undefined) {
    parts.push(`Approval ID: ${details.approval_id}`);
  }

  if (details.decision_note) {
    parts.push(`Note: ${details.decision_note}`);
  }

  if (details.status && details.approval_id !== undefined) {
    parts.push(`Decision: ${details.status}`);
  }

  return parts.length ? parts.join(" · ") : JSON.stringify(details);
};

const normalizeActivity = (activity) => ({
  id: activity.id,
  workItemId: activity.work_item_id ?? activity.workItemId ?? null,
  actorId: activity.actor_id ?? activity.actorId ?? null,
  actorName:
    activity.actor_name ??
    activity.actorName ??
    (activity.actor_id != null ? `User #${activity.actor_id}` : "System"),
  action: activity.action,
  details: activity.details,
  timestamp:
    activity.created_at ?? activity.timestamp ?? activity.createdAt ?? null,
});

export function ActivityHistoryPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await activityService.getActivity();

      if (!Array.isArray(data)) {
        throw new Error("The activity API returned an unexpected response.");
      }

      setActivities(data.map(normalizeActivity));
    } catch (err) {
      setError(
        err.userMessage || err.message || "Failed to fetch activity history",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const actors = useMemo(() => {
    const uniqueActors = new Map();

    activities.forEach((activity) => {
      if (activity.actorId != null) {
        uniqueActors.set(activity.actorId, {
          id: activity.actorId,
          name: activity.actorName,
        });
      }
    });

    return Array.from(uniqueActors.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [activities]);

  const actionTypes = useMemo(() => {
    const uniqueActions = [
      ...new Set(activities.map((activity) => activity.action).filter(Boolean)),
    ];

    return uniqueActions.sort().map((action) => ({
      value: action,
      label: formatAction(action),
    }));
  }, [activities]);

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const matchesActor =
          !actorFilter || String(activity.actorId) === actorFilter;

        const matchesAction = !actionFilter || activity.action === actionFilter;

        return matchesActor && matchesAction;
      }),
    [activities, actorFilter, actionFilter],
  );

  const resetFilters = () => {
    setActorFilter("");
    setActionFilter("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            System Audit &amp; Activity Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational event history for work-item changes and approvals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchActivities}
          isLoading={loading}
        >
          Refresh Stream
        </Button>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Actor:
            </span>
            <select
              value={actorFilter}
              onChange={(event) => setActorFilter(event.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700"
            >
              <option value="">All Actors</option>
              {actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Action:
            </span>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700"
            >
              <option value="">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(actorFilter || actionFilter) && (
          <Button
            variant="ghost"
            size="xs"
            icon={RotateCcw}
            onClick={resetFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchActivities} />}

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity events found"
          description="Try resetting your active filters to view activity entries."
          actionLabel="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-subtle overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Work Item</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-semibold">
                        {getInitials(activity.actorName)}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {activity.actorName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                      {formatAction(activity.action)}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {activity.workItemId != null ? (
                      <Link
                        to={`/work-items/${activity.workItemId}`}
                        className="font-mono text-brand-600 hover:text-brand-800 font-semibold underline underline-offset-2"
                      >
                        #{activity.workItemId}
                      </Link>
                    ) : (
                      <span className="text-slate-400">System</span>
                    )}
                  </td>

                  <td className="py-3 px-4 max-w-md">
                    <span className="text-slate-600 break-words">
                      {formatDetails(activity.details)}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                    {activity.timestamp ? (
                      <span title={formatDateTime(activity.timestamp)}>
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
