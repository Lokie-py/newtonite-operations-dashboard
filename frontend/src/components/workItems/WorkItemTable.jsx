import React from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge, TypeBadge } from "../common/Badge";
import {
  formatRelativeTime,
  formatDate,
  isOverdue,
  getInitials,
} from "../../utils/formatters";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
} from "lucide-react";

export function WorkItemTable({
  items = [],
  sortBy,
  sortOrder,
  onSort,
  isLoading = false,
}) {
  const navigate = useNavigate();

  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }

    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-brand-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-600" />
    );
  };

  const handleRowClick = (id) => {
    navigate(`/work-items/${id}`);
  };

  return (
    <div className="w-full overflow-hidden bg-white border border-slate-200 rounded-lg shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] select-none">
              <th scope="col" className="py-2.5 px-3.5 w-28 text-slate-700">
                Item ID
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 min-w-[320px] cursor-pointer group hover:bg-slate-100/70 transition-colors"
                onClick={() => onSort && onSort("title")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Title &amp; Context</span>
                  {renderSortIcon("title")}
                </div>
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 w-36 hidden md:table-cell text-slate-700"
              >
                Team
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 w-44 hidden sm:table-cell text-slate-700"
              >
                Assignee
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 w-28 cursor-pointer group hover:bg-slate-100/70 transition-colors"
                onClick={() => onSort && onSort("priority")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  {renderSortIcon("priority")}
                </div>
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 w-32 cursor-pointer group hover:bg-slate-100/70 transition-colors"
                onClick={() => onSort && onSort("status")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon("status")}
                </div>
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 w-32 cursor-pointer group hover:bg-slate-100/70 transition-colors hidden lg:table-cell"
                onClick={() => onSort && onSort("dueDate")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  {renderSortIcon("dueDate")}
                </div>
              </th>

              <th
                scope="col"
                className="py-2.5 px-3.5 w-28 cursor-pointer group hover:bg-slate-100/70 transition-colors hidden xl:table-cell"
                onClick={() => onSort && onSort("updatedAt")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Updated</span>
                  {renderSortIcon("updatedAt")}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((item) => {
              const teamId = item.teamId ?? item.team_id;
              const assigneeId = item.assigneeId ?? item.assigned_to_id;
              const updatedAt = item.updatedAt ?? item.updated_at;
              const dueDate = item.dueDate ?? item.due_date;

              // This endpoint provides IDs, not team/user display names.
              // Show accurate identifiers until we load the real labels.
              const assigneeLabel =
                assigneeId == null ? "Unassigned" : `User #${assigneeId}`;

              const overdue = isOverdue(dueDate, item.status);

              return (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowClick(item.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for work item ${item.id}: ${item.title}`}
                  className="hover:bg-slate-50/80 active:bg-slate-100/60 cursor-pointer transition-colors group focus:outline-none focus:bg-slate-50"
                >
                  <td className="py-2.5 px-3.5 font-mono text-[11px] font-semibold text-brand-700 whitespace-nowrap align-middle">
                    <div className="flex items-center gap-1.5">
                      <span>{item.id}</span>
                      <span
                        className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200"
                        title="Optimistic Concurrency Version"
                      >
                        v{item.version}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3.5 align-middle">
                    <div className="flex flex-col gap-1 max-w-lg min-w-0">
                      <span
                        className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors truncate"
                        title={item.title}
                      >
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <TypeBadge type={item.type || "task"} />
                        {item.requiresApproval && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            Approval: {item.approvalStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3.5 hidden md:table-cell whitespace-nowrap align-middle">
                    <span className="text-slate-600 font-medium truncate block max-w-[130px]">
                      {teamId == null ? "—" : `Team #${teamId}`}
                    </span>
                  </td>

                  <td className="py-2.5 px-3.5 hidden sm:table-cell whitespace-nowrap align-middle">
                    <div className="flex items-center gap-2 max-w-[160px]">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                        {assigneeId == null
                          ? "?"
                          : getInitials(`User ${assigneeId}`)}
                      </div>
                      <span
                        className="text-slate-800 truncate"
                        title={assigneeLabel}
                      >
                        {assigneeLabel}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3.5 whitespace-nowrap align-middle">
                    <PriorityBadge priority={item.priority} />
                  </td>

                  <td className="py-2.5 px-3.5 whitespace-nowrap align-middle">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="py-2.5 px-3.5 hidden lg:table-cell whitespace-nowrap align-middle">
                    {dueDate ? (
                      <div
                        className={`flex items-center gap-1 ${
                          overdue
                            ? "text-red-600 font-semibold"
                            : "text-slate-500"
                        }`}
                        title={
                          overdue
                            ? "SLA target overdue"
                            : `Due on ${formatDate(dueDate)}`
                        }
                      >
                        {overdue && (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        )}
                        <span>{formatDate(dueDate)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3.5 hidden xl:table-cell whitespace-nowrap text-slate-500 align-middle">
                    <div
                      className="flex items-center gap-1"
                      title={updatedAt || ""}
                    >
                      <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>
                        {updatedAt ? formatRelativeTime(updatedAt) : "—"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
