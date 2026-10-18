import React from "react";
import { formatRelativeTime } from "../../utils/formatters";
import {
  History,
  GitCommit,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  FileCheck,
  XCircle,
  RefreshCw,
} from "lucide-react";

const ACTION_ICONS = {
  CREATED: GitCommit,
  STATUS_CHANGED: RefreshCw,
  ASSIGNED: UserCheck,
  PRIORITY_CHANGED: AlertTriangle,
  APPROVED: FileCheck,
  REJECTED: XCircle,
  COMMENT_ADDED: MessageSquare,
  CONCURRENT_EDIT: AlertTriangle,
};

function getActivityDetails(act) {
  const details = act.details;

  // Details are already readable text.
  if (typeof details === "string") {
    return details;
  }

  // Handle structured activity details safely.
  if (details && typeof details === "object") {
    const parts = [];

    if (details.title) {
      parts.push(`Title: ${details.title}`);
    }

    if (details.status) {
      parts.push(`Status: ${details.status}`);
    }

    if (details.priority) {
      parts.push(`Priority: ${details.priority}`);
    }

    if (details.changed_fields) {
      const fields = Array.isArray(details.changed_fields)
        ? details.changed_fields.join(", ")
        : typeof details.changed_fields === "object"
          ? Object.keys(details.changed_fields).join(", ")
          : String(details.changed_fields);

      parts.push(`Changed fields: ${fields}`);
    }

    if (details.previous_version !== undefined) {
      parts.push(`Previous version: ${details.previous_version}`);
    }

    if (details.new_version !== undefined) {
      parts.push(`New version: ${details.new_version}`);
    }

    if (details.approval_id !== undefined) {
      parts.push(`Approval #${details.approval_id}`);
    }

    if (details.reviewer_id !== undefined) {
      parts.push(`Reviewer #${details.reviewer_id}`);
    }

    if (details.decision_note) {
      parts.push(`Note: ${details.decision_note}`);
    }

    // Fallback for other object shapes.
    if (parts.length === 0) {
      return JSON.stringify(details);
    }

    return parts.join(" · ");
  }

  // Handle missing or unexpected values.
  if (details === null || details === undefined) {
    return "";
  }

  return String(details);
}

export function ActivityTimeline({ activities = [] }) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No recorded activity events for this item yet.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((act, index) => {
          const isLast = index === activities.length - 1;
          const Icon = ACTION_ICONS[act.action] || History;
          const isComment = act.action === "COMMENT_ADDED";

          return (
            <li key={act.id || index}>
              <div className="relative pb-6">
                {!isLast && (
                  <span
                    className="absolute top-4 left-3.5 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Icon Indicator */}
                  <div
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full border shadow-subtle ${
                      isComment
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : act.action === "APPROVED"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : act.action === "REJECTED"
                            ? "bg-red-50 border-red-200 text-red-600"
                            : act.action === "CONCURRENT_EDIT"
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>

                  {/* Event Detail */}
                  <div className="min-w-0 flex-1 pt-0.5 flex justify-between space-x-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">
                          {typeof act.actorName === "string"
                            ? act.actorName
                            : act.actor_name || "System"}
                        </span>{" "}
                        <span className="text-slate-500">
                          {getActivityDetails(act)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right text-[11px] whitespace-nowrap text-slate-400">
                      {act.timestamp
                        ? formatRelativeTime(act.timestamp)
                        : act.created_at
                          ? formatRelativeTime(act.created_at)
                          : ""}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
