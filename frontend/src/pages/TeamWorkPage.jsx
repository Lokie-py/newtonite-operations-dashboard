import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { workItemsService, isMockMode } from "../api";
import { useAuth } from "../context/AuthContext";
import { WorkItemTable } from "../components/workItems/WorkItemTable";
import { PriorityBadge, TypeBadge } from "../components/common/Badge";
import { TableSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { Button } from "../components/common/Button";
import { INITIAL_TEAMS, INITIAL_USERS } from "../mock/initialData";
import { WORK_ITEM_STATUS } from "../utils/constants";
import { getInitials } from "../utils/formatters";
import { LayoutGrid, Table as TableIcon, RefreshCw } from "lucide-react";

const BACKEND_TEAM_IDS = {
  eng: 1,
};

function normalizeStatus(status) {
  const statusMap = {
    open: "Open",
    in_progress: "In Progress",
    blocked: "Blocked",
    in_review: "In Review",
    resolved: "Resolved",
    completed: "Resolved",
    closed: "Closed",
  };

  return statusMap[status] || status;
}

export function TeamWorkPage() {
  const navigate = useNavigate();
  const { currentUser, isManager } = useAuth();

  const [selectedTeamId, setSelectedTeamId] = useState(
    currentUser?.teamId || "eng",
  );
  const [viewMode, setViewMode] = useState("board");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeamItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const teamId = isMockMode()
        ? selectedTeamId
        : BACKEND_TEAM_IDS[selectedTeamId];

      if (!isMockMode() && !teamId) {
        throw new Error(
          `No backend team ID is configured for "${selectedTeamId}".`,
        );
      }

      const response = await workItemsService.getWorkItems({
        teamId,
        page: 1,
        pageSize: 100,
      });

      const fetchedItems = Array.isArray(response)
        ? response
        : response?.items || [];

      const normalizedItems = fetchedItems.map((item) => ({
        ...item,
        teamId: item.teamId ?? item.team_id,
        assigneeId: item.assigneeId ?? item.assigned_to_id,
        createdById: item.createdById ?? item.created_by_id,
        updatedAt: item.updatedAt ?? item.updated_at,
        createdAt: item.createdAt ?? item.created_at,
        status: normalizeStatus(item.status),
        priority:
          typeof item.priority === "string"
            ? item.priority.charAt(0).toUpperCase() +
              item.priority.slice(1).toLowerCase()
            : item.priority,
      }));

      setItems(normalizedItems);
    } catch (err) {
      setError(
        err.userMessage || err.message || "Failed to fetch team backlog",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    fetchTeamItems();
  }, [fetchTeamItems]);

  const currentTeam = INITIAL_TEAMS.find((team) => team.id === selectedTeamId);

  const boardColumns = [
    {
      status: WORK_ITEM_STATUS.OPEN,
      title: "Open",
      color: "border-slate-300",
    },
    {
      status: WORK_ITEM_STATUS.IN_PROGRESS,
      title: "In Progress",
      color: "border-blue-400",
    },
    {
      status: WORK_ITEM_STATUS.BLOCKED,
      title: "Blocked",
      color: "border-rose-400",
    },
    {
      status: WORK_ITEM_STATUS.IN_REVIEW,
      title: "In Review",
      color: "border-purple-400",
    },
    {
      status: WORK_ITEM_STATUS.RESOLVED,
      title: "Resolved",
      color: "border-emerald-400",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Team Work: {currentTeam?.name || "Operations"}</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {items.length} items
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentTeam?.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            >
              {INITIAL_TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center border border-slate-200 rounded-md bg-white p-0.5">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1 rounded ${
                viewMode === "board"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`p-1 rounded ${
                viewMode === "table"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchTeamItems}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchTeamItems} />}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : viewMode === "table" ? (
        <WorkItemTable items={items} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No work items found"
          description="There are no work items for this team yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
          {boardColumns.map((column) => {
            const columnItems = items.filter(
              (item) => item.status === column.status,
            );

            return (
              <div
                key={column.status}
                className="bg-slate-100/70 rounded-lg p-2.5 border border-slate-200 min-h-[450px] flex flex-col"
              >
                <div
                  className={`flex items-center justify-between pb-2 mb-2 border-b-2 ${column.color}`}
                >
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {column.title}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-subtle border border-slate-200">
                    {columnItems.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {columnItems.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 italic">
                      No items
                    </div>
                  ) : (
                    columnItems.map((item) => {
                      const assignee = INITIAL_USERS.find(
                        (user) => String(user.id) === String(item.assigneeId),
                      );

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigate(`/work-items/${item.id}`)}
                          className="bg-white p-3 rounded-md border border-slate-200 shadow-subtle hover:border-brand-400 hover:shadow-card cursor-pointer transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                              {item.id}
                            </span>
                            <PriorityBadge
                              priority={item.priority}
                              showIcon={false}
                            />
                          </div>

                          <h4 className="text-xs font-medium text-slate-900 line-clamp-2 leading-snug">
                            {item.title}
                          </h4>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <TypeBadge type={item.type || "Task"} />
                            {assignee && (
                              <div
                                className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold"
                                title={`Assigned to ${assignee.name}`}
                              >
                                {getInitials(assignee.name)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
