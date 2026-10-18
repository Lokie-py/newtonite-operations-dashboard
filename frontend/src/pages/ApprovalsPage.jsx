import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { approvalsService, workItemsService } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { TableSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { Button } from "../components/common/Button";
import { APPROVAL_STATUS } from "../utils/constants";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

const normalizeStatus = (status) => String(status || "").toLowerCase();

const statusLabel = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

export function ApprovalsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(APPROVAL_STATUS.PENDING);
  const [approvals, setApprovals] = useState([]);
  const [workItemsById, setWorkItemsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // The backend returns approval records, not work items, and currently
      // supports no status filter. Fetch the records and filter locally.
      const data = await approvalsService.getApprovals();
      const approvalRecords = Array.isArray(data) ? data : [];
      setApprovals(approvalRecords);

      // Approval records only contain work_item_id. Load the related work item
      // details separately so the queue can display meaningful titles/context.
      const uniqueWorkItemIds = [
        ...new Set(
          approvalRecords
            .map((approval) => approval.work_item_id)
            .filter(Boolean),
        ),
      ];

      const detailResults = await Promise.all(
        uniqueWorkItemIds.map(async (workItemId) => {
          try {
            const workItem = await workItemsService.getWorkItemById(workItemId);
            return [String(workItemId), workItem];
          } catch {
            return [String(workItemId), null];
          }
        }),
      );

      setWorkItemsById(Object.fromEntries(detailResults));
    } catch (err) {
      setError(err.userMessage || "Failed to fetch approvals queue");
      setApprovals([]);
      setWorkItemsById({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const visibleApprovals = approvals.filter(
    (approval) =>
      normalizeStatus(approval.status) === normalizeStatus(activeTab),
  );

  const decideApproval = async (approval, status, decisionNote = "") => {
    setProcessingId(approval.id);
    try {
      if (status === "approved") {
        await approvalsService.approve(approval.id, decisionNote);
      } else {
        await approvalsService.reject(approval.id, decisionNote);
      }

      toast.success(
        `Approval ${approval.id} ${status === "approved" ? "approved" : "rejected"}.`,
      );
      await fetchApprovals();
    } catch (err) {
      toast.error(err.userMessage || `Failed to ${status} approval`);
    } finally {
      setProcessingId(null);
    }
  };

  const tabs = [
    { key: APPROVAL_STATUS.PENDING, label: "Pending Queue", icon: Clock },
    {
      key: APPROVAL_STATUS.APPROVED,
      label: "Approved Requests",
      icon: CheckCircle2,
    },
    {
      key: APPROVAL_STATUS.REJECTED,
      label: "Rejected Requests",
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Approvals Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational signoff requests for work items that require review.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchApprovals}
          isLoading={loading}
        >
          Refresh Queue
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-all ${
                isActive
                  ? "border-brand-600 text-brand-700 bg-brand-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchApprovals} />}

      {loading ? (
        <div className="space-y-3">
          <TableSkeleton rows={4} cols={4} />
        </div>
      ) : visibleApprovals.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={`No ${String(activeTab).toLowerCase()} approvals`}
          description={`There are currently no ${String(activeTab).toLowerCase()} approval records.`}
        />
      ) : (
        <div className="space-y-4">
          {visibleApprovals.map((approval) => {
            const workItem = workItemsById[String(approval.work_item_id)];
            const isRequester =
              Number(approval.requested_by_id) === Number(currentUser?.id);
            const isAssignedReviewer =
              approval.reviewer_id == null ||
              Number(approval.reviewer_id) === Number(currentUser?.id);
            const canDecide =
              normalizeStatus(approval.status) === "pending" &&
              !isRequester &&
              isAssignedReviewer;

            return (
              <article
                key={approval.id}
                className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        Approval #{approval.id}
                      </span>
                      <span className="text-xs text-slate-500">
                        Work item #{approval.work_item_id}
                      </span>
                      <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                        {statusLabel(approval.status)}
                      </span>
                    </div>

                    <h3
                      onClick={() =>
                        navigate(`/work-items/${approval.work_item_id}`)
                      }
                      className="text-sm font-semibold text-slate-900 hover:text-brand-600 cursor-pointer transition-colors"
                    >
                      {workItem?.title || `Work item #${approval.work_item_id}`}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {workItem?.description ||
                        "Work item details are unavailable."}
                    </p>

                    <p className="text-xs text-slate-500">
                      Requested by user #{approval.requested_by_id}
                      {approval.reviewer_id != null
                        ? ` · Reviewer user #${approval.reviewer_id}`
                        : " · No reviewer assigned"}
                    </p>

                    {approval.decision_note && (
                      <p className="text-xs text-slate-600">
                        Decision note: {approval.decision_note}
                      </p>
                    )}

                    <p className="text-xs text-slate-400">
                      Created:{" "}
                      {approval.created_at
                        ? new Date(approval.created_at).toLocaleString()
                        : "—"}
                      {approval.decided_at
                        ? ` · Decided: ${new Date(approval.decided_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                </div>

                {normalizeStatus(approval.status) === "pending" && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    {canDecide ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            const note =
                              window.prompt("Optional approval note:", "") ??
                              null;
                            if (note !== null)
                              decideApproval(approval, "approved", note);
                          }}
                          isLoading={processingId === approval.id}
                          disabled={processingId !== null}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const note = window.prompt("Reason for rejection:");
                            if (note && note.trim()) {
                              decideApproval(approval, "rejected", note.trim());
                            } else if (note !== null) {
                              toast.error("Please enter a rejection reason.");
                            }
                          }}
                          disabled={processingId !== null}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">
                        {isRequester
                          ? "You cannot decide an approval you requested."
                          : "Only the assigned reviewer can decide this approval."}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
