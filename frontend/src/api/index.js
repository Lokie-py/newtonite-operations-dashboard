
import { authService as prodAuth } from "./services/auth.service";
import { workItemsService as prodWorkItems } from "./services/workItems.service";
import { approvalsService as prodApprovals } from "./services/approvals.service";
import { commentsService as prodComments } from "./services/comments.service";
import { teamsService as prodTeams } from "./services/teams.service";
import { activityService as prodActivity } from "./services/activity.service";

import {
  mockAuthService,
  mockWorkItemsService,
  mockApprovalsService,
  mockCommentsService,
  mockTeamsService,
  mockActivityService,
} from "../mock/mockAdapter";

// Dynamic resolver for Mock vs Live API mode
export const isMockMode = () => {
  const localSetting = localStorage.getItem("newtonite_force_mock");

  if (localSetting !== null) {
    return localSetting === "true";
  }

  return import.meta.env.VITE_USE_MOCK_DATA !== "false";
};

export const setMockMode = (enabled) => {
  localStorage.setItem("newtonite_force_mock", enabled ? "true" : "false");
  window.dispatchEvent(new Event("newtonite_api_mode_change"));
};

// Unified services that route dynamically between mock and live API
export const authService = {
  login: (...args) =>
    isMockMode()
      ? mockAuthService.login(...args)
      : prodAuth.login(...args),

  logout: (...args) =>
    isMockMode()
      ? mockAuthService.logout(...args)
      : prodAuth.logout(...args),

  getCurrentUser: (...args) =>
    isMockMode()
      ? mockAuthService.getCurrentUser(...args)
      : prodAuth.getCurrentUser(...args),
};

export const workItemsService = {
  getWorkItems: (...args) =>
    isMockMode()
      ? mockWorkItemsService.getWorkItems(...args)
      : prodWorkItems.getWorkItems(...args),

  getWorkItemById: (...args) =>
    isMockMode()
      ? mockWorkItemsService.getWorkItemById(...args)
      : prodWorkItems.getWorkItemById(...args),

  createWorkItem: (...args) =>
    isMockMode()
      ? mockWorkItemsService.createWorkItem(...args)
      : prodWorkItems.createWorkItem(...args),

  updateWorkItem: (...args) =>
    isMockMode()
      ? mockWorkItemsService.updateWorkItem(...args)
      : prodWorkItems.updateWorkItem(...args),

  transitionStatus: (...args) =>
    isMockMode()
      ? mockWorkItemsService.transitionStatus(...args)
      : prodWorkItems.transitionStatus(...args),

  assignWorkItem: (...args) =>
    isMockMode()
      ? mockWorkItemsService.assignWorkItem(...args)
      : prodWorkItems.assignWorkItem(...args),

  changePriority: (...args) =>
    isMockMode()
      ? mockWorkItemsService.changePriority(...args)
      : prodWorkItems.changePriority(...args),

  simulateConflict: (...args) =>
    isMockMode()
      ? mockWorkItemsService.simulateConflict(...args)
      : prodWorkItems.simulateConflict(...args),
};

export const approvalsService = {
  getApprovals: (...args) =>
    isMockMode()
      ? mockApprovalsService.getApprovals(...args)
      : prodApprovals.getApprovals(...args),

  createApproval: (...args) => {
    if (isMockMode()) {
      if (typeof mockApprovalsService.createApproval !== "function") {
        throw new Error(
          "Creating approval requests is only available in live API mode.",
        );
      }

      return mockApprovalsService.createApproval(...args);
    }

    return prodApprovals.createApproval(...args);
  },

  approve: (...args) =>
    isMockMode()
      ? mockApprovalsService.approve(...args)
      : prodApprovals.approve(...args),

  reject: (...args) =>
    isMockMode()
      ? mockApprovalsService.reject(...args)
      : prodApprovals.reject(...args),
};

export const commentsService = {
  getComments: (...args) =>
    isMockMode()
      ? mockCommentsService.getComments(...args)
      : prodComments.getComments(...args),

  addComment: (...args) =>
    isMockMode()
      ? mockCommentsService.addComment(...args)
      : prodComments.addComment(...args),
};

export const teamsService = {
  getTeams: (...args) =>
    isMockMode()
      ? mockTeamsService.getTeams(...args)
      : prodTeams.getTeams(...args),

  getTeamMembers: (...args) =>
    isMockMode()
      ? mockTeamsService.getTeamMembers(...args)
      : prodTeams.getTeamMembers(...args),

  updateMemberRole: (...args) =>
    isMockMode()
      ? mockTeamsService.updateMemberRole(...args)
      : prodTeams.updateMemberRole(...args),
};

export const activityService = {
  getActivity: (...args) =>
    isMockMode()
      ? mockActivityService.getActivity(...args)
      : prodActivity.getActivity(...args),
};
