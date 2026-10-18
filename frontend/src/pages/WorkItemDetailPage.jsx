import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  workItemsService,
  approvalsService,
  commentsService,
  activityService,
  isMockMode,
  teamsService,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  StatusBadge,
  PriorityBadge,
  TypeBadge,
} from "../components/common/Badge";
import { StatusTransitionMenu } from "../components/workItems/StatusTransitionMenu";
import { ApprovalCard } from "../components/workItems/ApprovalCard";
import { ActivityTimeline } from "../components/workItems/ActivityTimeline";
import { CommentList } from "../components/workItems/CommentList";
import { ConcurrencyConflictModal } from "../components/workItems/ConcurrencyConflictModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Select";
import { Skeleton } from "../components/common/Skeleton";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { INITIAL_USERS, INITIAL_TEAMS } from "../mock/initialData";
import {
  formatDateTime,
  formatRelativeTime,
  isOverdue,
} from "../utils/formatters";
import { WORK_ITEM_STATUS, WORK_ITEM_PRIORITY } from "../utils/constants";
import { ArrowLeft, Edit3, RefreshCw, Sparkles } from "lucide-react";

function normalizeStatus(status) {
  if (!status) return status;

  const normalized = String(status).toLowerCase();

  const statusMap = {
    open: "Open",
    in_progress: "In Progress",
    blocked: "Blocked",
    completed: "Resolved",
    resolved: "Resolved",
    closed: "Closed",
    in_review: "In Review",
  };

  return statusMap[normalized] || status;
}

function normalizePriority(priority) {
  if (!priority) return priority;

  const normalized = String(priority).toLowerCase();

  const priorityMap = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Critical",
    critical: "Critical",
  };

  return priorityMap[normalized] || priority;
}

function toBackendPriority(priority) {
  const normalized = String(priority || "").toLowerCase();

  return normalized === "critical" ? "urgent" : normalized;
}

function normalizeWorkItem(data) {
  if (!data) return data;

  return {
    ...data,
    teamId: data.teamId ?? data.team_id,
    assigneeId: data.assigneeId ?? data.assigned_to_id,
    creatorId: data.creatorId ?? data.created_by_id,
    createdAt: data.createdAt ?? data.created_at,
    updatedAt: data.updatedAt ?? data.updated_at,
    dueDate: data.dueDate ?? data.due_date,
    requiresApproval: data.requiresApproval ?? data.requires_approval ?? false,
    status: normalizeStatus(data.status),
    priority: normalizePriority(data.priority),
  };
}

export function WorkItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, canApprove, canEditWorkItem } = useAuth();

  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [approvalRecord, setApprovalRecord] = useState(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [serverConflictData, setServerConflictData] = useState(null);
  const [pendingClientAction, setPendingClientAction] = useState(null);

  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [targetNextStatus, setTargetNextStatus] = useState(null);

  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await workItemsService.getWorkItemById(id);
      setItem(normalizeWorkItem(data));

      const [cmts, acts, approvalResults] = await Promise.all([
        commentsService.getComments(id).catch(() => []),
        activityService.getActivity({ workItemId: id }).catch(() => []),
        approvalsService.getApprovals({ work_item_id: id }).catch(() => []),
      ]);

      setComments(Array.isArray(cmts) ? cmts : []);
      setActivities(Array.isArray(acts) ? acts : []);

      // Approvals are separate records in the backend, not fields on a work item.
      const matchingApprovals = Array.isArray(approvalResults)
        ? approvalResults.filter(
            (approval) => String(approval.work_item_id) === String(id),
          )
        : [];
      setApprovalRecord(matchingApprovals[0] ?? null);
    } catch (err) {
      setError(err.userMessage || `Failed to load work item ${id}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  const fetchTeamMembers = useCallback(async (teamId) => {
    if (
      isMockMode() ||
      teamId === null ||
      teamId === undefined ||
      teamId === ""
    ) {
      setTeamMembers([]);
      setTeamMembersError(null);
      return;
    }

    try {
      setTeamMembersLoading(true);
      setTeamMembersError(null);
      const members = await teamsService.getTeamMembers(teamId);
      setTeamMembers(Array.isArray(members) ? members : []);
    } catch (err) {
      setTeamMembers([]);
      setTeamMembersError(
        err.userMessage || "Could not load members for this team.",
      );
    } finally {
      setTeamMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (item?.teamId !== undefined && item?.teamId !== null) {
      fetchTeamMembers(item.teamId);
    }
  }, [item?.teamId, fetchTeamMembers]);

  const refreshActivities = async () => {
    const acts = await activityService.getActivity({ workItemId: id });
    setActivities(Array.isArray(acts) ? acts : []);
  };

  const executeStatusTransition = async (newStatus) => {
    if (String(newStatus).toLowerCase() === "closed") {
      setTargetNextStatus(newStatus);
      setConfirmCloseOpen(true);
      return;
    }

    await applyStatusTransition(newStatus);
  };

  const applyStatusTransition = async (newStatus) => {
    if (!item) return;

    setIsUpdating(true);
    const previousStatus = item.status;

    setItem((prev) => ({ ...prev, status: normalizeStatus(newStatus) }));

    try {
      const backendStatus = String(newStatus)
        .toLowerCase()
        .replaceAll(" ", "_");

      const updated = await workItemsService.transitionStatus(
        item.id,
        backendStatus,
        item.version,
      );

      setItem(normalizeWorkItem(updated));
      toast.success(`Status updated to ${normalizeStatus(newStatus)}`);
      await refreshActivities();
    } catch (err) {
      setItem((prev) => ({ ...prev, status: previousStatus }));

      if (err.isConflict) {
        setServerConflictData(err.data?.currentItem);
        setPendingClientAction({ type: "STATUS", value: newStatus });
        setConflictModalOpen(true);
        toast.error(
          "Concurrency conflict: record changed by another operator.",
        );
      } else {
        toast.error(err.userMessage || "Status transition failed.");
      }
    } finally {
      setIsUpdating(false);
      setConfirmCloseOpen(false);
    }
  };

  const handleAssigneeChange = async (selectedValue) => {
    if (!item) return;

    // Select normally provides an event, but accepting a raw value makes this
    // handler resilient if a caller passes the value directly.
    const rawValue = selectedValue?.target
      ? selectedValue.target.value
      : selectedValue;
    const newAssigneeId =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (newAssigneeId !== null && !Number.isInteger(newAssigneeId)) {
      toast.error("Please select a valid assignee.");
      return;
    }

    const currentAssigneeId = item.assigneeId ?? null;
    if (
      (newAssigneeId === null && currentAssigneeId === null) ||
      (newAssigneeId !== null && Number(currentAssigneeId) === newAssigneeId)
    ) {
      return;
    }

    const previousItem = item;
    setIsUpdating(true);

    try {
      const updated = await workItemsService.assignWorkItem(
        item.id,
        newAssigneeId,
        item.version,
      );

      setItem(normalizeWorkItem(updated));
      toast.success(
        newAssigneeId === null
          ? "Work item unassigned successfully."
          : "Work item assigned successfully.",
      );
      await refreshActivities();
    } catch (err) {
      setItem(previousItem);
      toast.error(err.userMessage || "Failed to update assignee.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!item || newPriority === item.priority) return;

    const previousItem = item;
    setIsUpdating(true);

    // Optimistic update keeps the badge and dropdown in sync.
    setItem((prev) => ({
      ...prev,
      priority: normalizePriority(newPriority),
    }));

    try {
      const updated = await workItemsService.changePriority(
        item.id,
        toBackendPriority(newPriority),
        item.version,
      );

      setItem(normalizeWorkItem(updated));
      toast.success(`Priority updated to ${normalizePriority(newPriority)}`);
      await refreshActivities();
    } catch (err) {
      setItem(previousItem);

      if (err.isConflict) {
        setServerConflictData(err.data?.currentItem);
        setPendingClientAction({
          type: "PRIORITY",
          value: newPriority,
        });
        setConflictModalOpen(true);
        toast.error(
          "Concurrency conflict: record changed by another operator.",
        );
      } else {
        toast.error(err.userMessage || "Failed to update priority");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!item || !canEditWorkItem(item)) {
      toast.error("You don't have permission to request approval.");
      return;
    }

    if (isMockMode()) {
      toast.error("Approval requests require backend mode.");
      return;
    }

    if (!selectedReviewerId) {
      toast.error("Please select a reviewer.");
      return;
    }

    setIsUpdating(true);
    try {
      const newApproval = await approvalsService.createApproval(
        item.id,
        selectedReviewerId,
      );
      setApprovalRecord(newApproval);
      toast.success("Approval request created successfully.");
      await refreshActivities();
    } catch (err) {
      console.error("Approval request failed:", err);
      console.error("Approval error response:", err.response?.data);
      toast.error(
        err.response?.data?.detail ||
          err.userMessage ||
          err.message ||
          "Failed to create approval request.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (note) => {
    if (!approvalRecord?.id) {
      toast.error("No approval request exists for this work item.");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedApproval = await approvalsService.approve(
        approvalRecord.id,
        note,
      );
      setApprovalRecord(updatedApproval);
      toast.success("Approval decision recorded.");
      await refreshActivities();
    } catch (err) {
      toast.error(err.userMessage || "Approval failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (reason) => {
    if (!approvalRecord?.id) {
      toast.error("No approval request exists for this work item.");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedApproval = await approvalsService.reject(
        approvalRecord.id,
        reason,
      );
      setApprovalRecord(updatedApproval);
      toast.warning("Rejection decision recorded.");
      await refreshActivities();
    } catch (err) {
      toast.error(err.userMessage || "Rejection failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (text) => {
    try {
      const newComment = await commentsService.addComment(item.id, text);
      setComments((prev) => [...prev, newComment]);
      toast.success("Comment posted");
      await refreshActivities();
    } catch (err) {
      toast.error(err.userMessage || "Failed to post comment");
    }
  };

  const handleSimulateConflict = async () => {
    try {
      await workItemsService.simulateConflict(item.id);
      toast.info(
        "Simulated peer modification. Refresh the item before attempting another update.",
      );
    } catch {
      toast.error("Simulation failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <ErrorAlert
        message={error || "Work item not found"}
        onRetry={fetchItemDetails}
      />
    );
  }

  const team = INITIAL_TEAMS.find(
    (teamOption) => String(teamOption.id) === String(item.teamId),
  );

  const assignee =
    teamMembers.find(
      (userOption) => String(userOption.id) === String(item.assigneeId),
    ) ||
    (isMockMode()
      ? INITIAL_USERS.find(
          (userOption) => String(userOption.id) === String(item.assigneeId),
        )
      : null);

  const creator = INITIAL_USERS.find(
    (userOption) => String(userOption.id) === String(item.creatorId),
  );

  const assigneeOptions = isMockMode()
    ? INITIAL_USERS.map((userOption) => ({
        value: String(userOption.id),
        label: `${userOption.name} (${userOption.role})`,
      }))
    : teamMembers.map((userOption) => ({
        value: String(userOption.id),
        label: `${userOption.full_name || userOption.name || userOption.email}${
          userOption.email ? ` (${userOption.email})` : ""
        }`,
      }));

  const overdue = isOverdue(item.dueDate, item.status);
  const editable = canEditWorkItem(item);

  return (
    <div className="space-y-6">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="xs"
            icon={ArrowLeft}
            onClick={() => navigate("/work-items")}
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
              {item.id}
            </span>
            <span
              className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
              title="Optimistic Concurrency Version"
            >
              v{item.version}
            </span>
            <TypeBadge type={item.type} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMockMode() && (
            <Button
              variant="outline"
              size="xs"
              icon={Sparkles}
              onClick={handleSimulateConflict}
              title="Test concurrency conflict behavior"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              Simulate Peer Conflict
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            icon={RefreshCw}
            onClick={fetchItemDetails}
            isLoading={loading}
          >
            Refresh
          </Button>

          {editable && (
            <Button
              variant="secondary"
              size="xs"
              icon={Edit3}
              onClick={() => navigate(`/work-items/${item.id}/edit`)}
            >
              Edit Details
            </Button>
          )}

          <StatusTransitionMenu
            currentStatus={item.status}
            onTransition={executeStatusTransition}
            isLoading={isUpdating}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {item.title}
              </h2>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Description & Impact Analysis
              </h4>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-3.5 rounded-md border border-slate-200">
                {item.description}
              </div>
            </div>
          </div>

          {!approvalRecord && editable && !isMockMode() && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Approval Request
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Select an active member of this team to review this work item.
                </p>
              </div>

              <Select
                value={selectedReviewerId}
                onChange={(event) => setSelectedReviewerId(event.target.value)}
                options={[
                  { value: "", label: "Select a reviewer" },
                  ...teamMembers
                    .filter(
                      (member) => String(member.id) !== String(currentUser?.id),
                    )
                    .map((member) => ({
                      value: String(member.id),
                      label: `${member.full_name || member.name || member.email}${
                        member.email ? ` (${member.email})` : ""
                      }`,
                    })),
                ]}
                disabled={
                  isUpdating || teamMembersLoading || Boolean(teamMembersError)
                }
              />

              {teamMembersLoading && (
                <p className="text-xs text-slate-500">Loading team members…</p>
              )}
              {teamMembersError && (
                <p className="text-xs text-red-600">{teamMembersError}</p>
              )}
              {!teamMembersLoading &&
                !teamMembersError &&
                teamMembers.filter(
                  (member) => String(member.id) !== String(currentUser?.id),
                ).length === 0 && (
                  <p className="text-xs text-slate-500">
                    No other active team members are available to review this
                    item.
                  </p>
                )}

              <Button
                variant="primary"
                size="xs"
                onClick={handleRequestApproval}
                isLoading={isUpdating}
                disabled={
                  isUpdating ||
                  teamMembersLoading ||
                  Boolean(teamMembersError) ||
                  !selectedReviewerId
                }
              >
                Request Approval
              </Button>
            </div>
          )}

          {approvalRecord && (
            <ApprovalCard
              item={{
                ...item,
                requiresApproval: true,
                approvalId: approvalRecord.id,
                approvalStatus: approvalRecord.status,
                approvedBy: approvalRecord.reviewer_id,
                approvalDecisionAt: approvalRecord.decided_at,
                approvalNote:
                  approvalRecord.status === "approved"
                    ? approvalRecord.decision_note
                    : null,
                rejectionReason:
                  approvalRecord.status === "rejected"
                    ? approvalRecord.decision_note
                    : null,
              }}
              canApprove={
                canApprove(item) &&
                approvalRecord.status === "pending" &&
                approvalRecord.requested_by_id !== currentUser?.id &&
                (approvalRecord.reviewer_id == null ||
                  approvalRecord.reviewer_id === currentUser?.id)
              }
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={isUpdating}
            />
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Operational Discussion ({comments.length})
              </h3>
            </div>

            <CommentList
              comments={comments}
              onAddComment={handleAddComment}
              currentUser={currentUser}
              isSubmitting={isUpdating}
            />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                System Audit Trail & History
              </h3>
              <span className="text-[10px] text-slate-400">
                Chronological Event Stream
              </span>
            </div>

            <ActivityTimeline activities={activities} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle space-y-4">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Work Item Attributes
            </h4>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Status:</span>
              <StatusBadge status={item.status} />
            </div>

            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Priority:</span>
                <PriorityBadge priority={item.priority} />
              </div>

              {editable && (
                <div className="pt-1">
                  <Select
                    value={item.priority}
                    onChange={(event) =>
                      handlePriorityChange(event.target.value)
                    }
                    options={Object.values(WORK_ITEM_PRIORITY)}
                    disabled={isUpdating}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Responsible Team:</span>
              <span className="font-semibold text-slate-800">
                {team?.name || item.teamId || "—"}
              </span>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assignee:</span>
                <span className="font-medium text-slate-800">
                  {assignee?.full_name ||
                    assignee?.name ||
                    assignee?.email ||
                    "Unassigned"}
                </span>
              </div>

              {editable && (
                <div className="pt-1">
                  <Select
                    value={item.assigneeId ?? ""}
                    onChange={(event) => {
                      handleAssigneeChange(event.target.value);
                    }}
                    options={[
                      { value: "", label: "Unassigned" },
                      ...assigneeOptions,
                    ]}
                    disabled={
                      isUpdating ||
                      teamMembersLoading ||
                      (!isMockMode() && Boolean(teamMembersError))
                    }
                  />
                  {teamMembersLoading && !isMockMode() && (
                    <p className="mt-1 text-xs text-slate-500">
                      Loading team members…
                    </p>
                  )}
                  {teamMembersError && !isMockMode() && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-red-600">{teamMembersError}</p>
                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 hover:underline"
                        onClick={() => fetchTeamMembers(item.teamId)}
                      >
                        Retry loading members
                      </button>
                    </div>
                  )}
                  {!teamMembersLoading &&
                    !teamMembersError &&
                    !isMockMode() &&
                    teamMembers.length === 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        No active members are available for this team.
                      </p>
                    )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Target SLA Date:</span>
              <span
                className={`font-medium ${
                  overdue ? "text-red-600 font-semibold" : "text-slate-800"
                }`}
              >
                {item.dueDate ? formatDateTime(item.dueDate) : "No SLA set"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
              <span className="text-slate-400">Created By:</span>
              <span className="text-slate-600">
                {creator?.name || "System Operator"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Created:</span>
              <span className="text-slate-600">
                {item.createdAt ? formatDateTime(item.createdAt) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Last Modified:</span>
              <span className="text-slate-600">
                {item.updatedAt ? formatRelativeTime(item.updatedAt) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConcurrencyConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        serverData={serverConflictData}
        clientData={item}
        onRefresh={() => {
          setConflictModalOpen(false);
          fetchItemDetails();
        }}
      />

      <ConfirmDialog
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => applyStatusTransition(targetNextStatus)}
        title="Confirm Work Item Closure"
        message="Closing an item marks all active SLAs as fulfilled and locks standard operational remediation. Are you sure you wish to continue?"
        confirmText="Confirm & Close"
        variant="primary"
        isLoading={isUpdating}
      />
    </div>
  );
}
