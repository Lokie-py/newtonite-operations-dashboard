import { mockStore } from './mockStore';

const LATENCY = parseInt(import.meta.env.VITE_MOCK_LATENCY || '180', 10);

function delay(ms = LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAuthService = {
  async login(email, password) {
    await delay();
    return mockStore.login(email, password);
  },

  async logout() {
    await delay(100);
    return mockStore.logout();
  },

  async getCurrentUser() {
    await delay(100);
    return mockStore.getCurrentUser();
  },
};

export const mockWorkItemsService = {
  async getWorkItems(params = {}) {
    await delay();
    return mockStore.getWorkItems(params);
  },

  async getWorkItemById(id) {
    await delay();
    return mockStore.getWorkItemById(id);
  },

  async createWorkItem(data) {
    await delay();
    return mockStore.createWorkItem(data);
  },

  async updateWorkItem(id, data, version) {
    await delay();
    return mockStore.updateWorkItem(id, data, version);
  },

  async transitionStatus(id, status, version) {
    await delay();
    return mockStore.transitionStatus(id, status, version);
  },

  async assignWorkItem(id, assigneeId, version) {
    await delay();
    return mockStore.assignWorkItem(id, assigneeId, version);
  },

  async changePriority(id, priority, version) {
    await delay();
    return mockStore.changePriority(id, priority, version);
  },

  async simulateConflict(id) {
    await delay(50);
    return mockStore.simulateConflict(id);
  },
};

export const mockApprovalsService = {
  async getApprovals(params = {}) {
    await delay();
    return mockStore.getApprovals(params);
  },

  async approve(id, note) {
    await delay();
    return mockStore.approveWorkItem(id, note);
  },

  async reject(id, reason) {
    await delay();
    return mockStore.rejectWorkItem(id, reason);
  },
};

export const mockCommentsService = {
  async getComments(workItemId) {
    await delay();
    return mockStore.getComments(workItemId);
  },

  async addComment(workItemId, content) {
    await delay();
    return mockStore.addComment(workItemId, content);
  },
};

export const mockTeamsService = {
  async getTeams() {
    await delay();
    return mockStore.getTeams();
  },

  async getTeamMembers(teamId) {
    await delay();
    return mockStore.getTeamMembers(teamId);
  },

  async updateMemberRole(teamId, userId, role) {
    await delay();
    return mockStore.updateMemberRole(teamId, userId, role);
  },
};

export const mockActivityService = {
  async getActivity(params = {}) {
    await delay();
    return mockStore.getActivity(params);
  },
};
