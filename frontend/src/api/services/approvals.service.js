
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const approvalsService = {
  async getApprovals(params = {}) {
    return apiClient.get(API_ENDPOINTS.APPROVALS.LIST, { params });
  },

  async createApproval(workItemId, reviewerId = null) {
    if (!workItemId || !Number.isInteger(Number(workItemId))) {
      throw new Error("A valid work item ID is required.");
    }

    const payload = {
      work_item_id: Number(workItemId),
    };

    if (reviewerId !== null && reviewerId !== "") {
      const parsedReviewerId = Number(reviewerId);

      if (!Number.isInteger(parsedReviewerId) || parsedReviewerId <= 0) {
        throw new Error("Please select a valid reviewer.");
      }

      payload.reviewer_id = parsedReviewerId;
    }

    return apiClient.post(API_ENDPOINTS.APPROVALS.LIST, payload);
  },

  async approve(id, note = "") {
    return apiClient.post(API_ENDPOINTS.APPROVALS.DECISION(id), {
      status: "approved",
      decision_note: note,
    });
  },

  async reject(id, reason = "") {
    return apiClient.post(API_ENDPOINTS.APPROVALS.DECISION(id), {
      status: "rejected",
      decision_note: reason,
    });
  },
};
