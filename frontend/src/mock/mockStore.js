import {
  INITIAL_USERS,
  INITIAL_TEAMS,
  INITIAL_WORK_ITEMS,
  INITIAL_COMMENTS,
  INITIAL_ACTIVITIES,
} from './initialData';
import { ApiError } from '../api/errors';
import { APPROVAL_STATUS, ALLOWED_STATUS_TRANSITIONS } from '../utils/constants';

const STORAGE_KEY = 'newtonite_mock_store_v1';

class MockStore {
  constructor() {
    this.init();
  }

  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.users = parsed.users || [...INITIAL_USERS];
        this.teams = parsed.teams || [...INITIAL_TEAMS];
        this.workItems = parsed.workItems || [...INITIAL_WORK_ITEMS];
        this.comments = parsed.comments || [...INITIAL_COMMENTS];
        this.activities = parsed.activities || [...INITIAL_ACTIVITIES];
        this.currentUser = parsed.currentUser || this.users[0];
        return;
      } catch (e) {
        console.error('Failed to parse mock store, resetting to defaults', e);
      }
    }

    this.reset();
  }

  persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users: this.users,
          teams: this.teams,
          workItems: this.workItems,
          comments: this.comments,
          activities: this.activities,
          currentUser: this.currentUser,
        })
      );
    } catch (e) {
      console.warn('LocalStorage error in mock store persist:', e);
    }
  }

  reset() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.teams = JSON.parse(JSON.stringify(INITIAL_TEAMS));
    this.workItems = JSON.parse(JSON.stringify(INITIAL_WORK_ITEMS));
    this.comments = JSON.parse(JSON.stringify(INITIAL_COMMENTS));
    this.activities = JSON.parse(JSON.stringify(INITIAL_ACTIVITIES));
    this.currentUser = this.users[0];
    this.persist();
  }

  // --- Auth & User ---
  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new ApiError('User not found', 404);
    this.currentUser = user;
    this.persist();
    return this.currentUser;
  }

  login(email, password) {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new ApiError('Invalid email or password. Please check your credentials.', 401);
    }
    this.currentUser = user;
    this.persist();
    return this.currentUser;
  }

  logout() {
    // Keep user state clean
    this.currentUser = null;
    this.persist();
    return { success: true };
  }

  // --- Work Items ---
  getWorkItems(params = {}) {
    const {
      search = '',
      status = '',
      priority = '',
      teamId = '',
      assigneeId = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 10,
    } = params;

    let items = [...this.workItems];

    // Filter: Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    // Filter: Status
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // Filter: Priority
    if (priority) {
      items = items.filter((item) => item.priority === priority);
    }

    // Filter: Team
    if (teamId) {
      items = items.filter((item) => item.teamId === teamId);
    }

    // Filter: Assignee
    if (assigneeId) {
      items = items.filter((item) => item.assigneeId === assigneeId);
    }

    // Sorting
    const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    items.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'priority') {
        valA = priorityWeight[a.priority] || 0;
        valB = priorityWeight[b.priority] || 0;
      } else if (sortBy === 'dueDate' || sortBy === 'updatedAt' || sortBy === 'createdAt') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const pageNum = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 10;
    const startIndex = (pageNum - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  getWorkItemById(id) {
    const item = this.workItems.find((w) => w.id === id);
    if (!item) {
      throw new ApiError(`Work item with ID ${id} not found`, 404);
    }
    return JSON.parse(JSON.stringify(item));
  }

  createWorkItem(data) {
    const nextNum = this.workItems.length + 101;
    const newId = `OPS-${nextNum}`;

    const newItem = {
      id: newId,
      title: data.title,
      description: data.description,
      type: data.type,
      teamId: data.teamId,
      assigneeId: data.assigneeId,
      creatorId: this.currentUser?.id || 'usr-1',
      priority: data.priority,
      status: data.status || 'Open',
      dueDate: data.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requiresApproval: !!data.requiresApproval,
      requiredApproverRole: data.requiresApproval ? data.requiredApproverRole || 'Manager' : null,
      approvalStatus: data.requiresApproval ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.NOT_REQUIRED,
      approvalNote: null,
      approvedBy: null,
      approvalDecisionAt: null,
      rejectionReason: null,
      version: 1,
    };

    this.workItems.unshift(newItem);

    // Record activity
    this.logActivity({
      workItemId: newItem.id,
      workItemTitle: newItem.title,
      action: 'CREATED',
      details: `Created ${newItem.type.toLowerCase()} item with priority ${newItem.priority}`,
    });

    this.persist();
    return newItem;
  }

  updateWorkItem(id, data, clientVersion) {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new ApiError(`Work item ${id} not found`, 404);
    }

    const current = this.workItems[index];

    // Concurrency Check (Optimistic Concurrency Control)
    if (
      clientVersion !== undefined &&
      clientVersion !== null &&
      Number(clientVersion) !== Number(current.version)
    ) {
      throw new ApiError(
        `Concurrency Conflict: Work item ${id} has been modified by another user (Server version: v${current.version}, your version: v${clientVersion}). Please refresh before overwriting.`,
        409,
        { currentItem: current }
      );
    }

    const updated = {
      ...current,
      ...data,
      id: current.id, // Immutable ID
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.workItems[index] = updated;

    this.logActivity({
      workItemId: updated.id,
      workItemTitle: updated.title,
      action: 'UPDATED',
      details: 'Updated work item details',
    });

    this.persist();
    return updated;
  }

  transitionStatus(id, newStatus, clientVersion) {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) throw new ApiError(`Work item ${id} not found`, 404);

    const current = this.workItems[index];

    // Concurrency check
    if (
      clientVersion !== undefined &&
      clientVersion !== null &&
      Number(clientVersion) !== Number(current.version)
    ) {
      throw new ApiError(
        `Concurrency Conflict: Work item ${id} was updated concurrently by another user.`,
        409,
        { currentItem: current }
      );
    }

    // Validate workflow transition
    const allowed = ALLOWED_STATUS_TRANSITIONS[current.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        `Invalid status transition: Cannot transition directly from "${current.status}" to "${newStatus}".`,
        400
      );
    }

    const oldStatus = current.status;
    current.status = newStatus;
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    this.logActivity({
      workItemId: current.id,
      workItemTitle: current.title,
      action: 'STATUS_CHANGED',
      details: `Changed status from "${oldStatus}" to "${newStatus}"`,
    });

    this.persist();
    return current;
  }

  assignWorkItem(id, assigneeId, clientVersion) {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) throw new ApiError(`Work item ${id} not found`, 404);

    const current = this.workItems[index];

    if (
      clientVersion !== undefined &&
      clientVersion !== null &&
      Number(clientVersion) !== Number(current.version)
    ) {
      throw new ApiError('Conflict: Work item was updated by another user.', 409, {
        currentItem: current,
      });
    }

    const targetUser = this.users.find((u) => u.id === assigneeId);
    if (!targetUser) throw new ApiError('Assignee user not found', 404);

    current.assigneeId = assigneeId;
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    this.logActivity({
      workItemId: current.id,
      workItemTitle: current.title,
      action: 'ASSIGNED',
      details: `Assigned to ${targetUser.name}`,
    });

    this.persist();
    return current;
  }

  changePriority(id, priority, clientVersion) {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) throw new ApiError(`Work item ${id} not found`, 404);

    const current = this.workItems[index];

    if (
      clientVersion !== undefined &&
      clientVersion !== null &&
      Number(clientVersion) !== Number(current.version)
    ) {
      throw new ApiError('Conflict: Work item was updated by another user.', 409, {
        currentItem: current,
      });
    }

    const oldPriority = current.priority;
    current.priority = priority;
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    this.logActivity({
      workItemId: current.id,
      workItemTitle: current.title,
      action: 'PRIORITY_CHANGED',
      details: `Changed priority from "${oldPriority}" to "${priority}"`,
    });

    this.persist();
    return current;
  }

  // Feature: Explicit simulation of concurrent mutation by another user
  simulateConflict(id) {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) throw new ApiError(`Work item ${id} not found`, 404);

    const current = this.workItems[index];
    current.version += 1;
    current.title = `${current.title} [Updated concurrently by Sarah]`;
    current.updatedAt = new Date().toISOString();

    this.logActivity({
      workItemId: current.id,
      workItemTitle: current.title,
      actorId: 'usr-1',
      actorName: 'Sarah Jenkins (Concurrent Session)',
      action: 'CONCURRENT_EDIT',
      details: 'Simulated concurrent modification by Sarah Jenkins (bumped version)',
    });

    this.persist();
    return current;
  }

  // --- Approvals ---
  getApprovals(params = {}) {
    const { status = '' } = params;
    let items = this.workItems.filter((w) => w.requiresApproval);

    if (status) {
      items = items.filter((w) => w.approvalStatus === status);
    }

    return items;
  }

  approveWorkItem(id, note = '') {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) throw new ApiError(`Work item ${id} not found`, 404);

    const current = this.workItems[index];

    if (current.approvalStatus === APPROVAL_STATUS.APPROVED) {
      throw new ApiError('This item has already been approved.', 400);
    }

    current.approvalStatus = APPROVAL_STATUS.APPROVED;
    current.approvalNote = note;
    current.approvedBy = this.currentUser?.id || 'usr-1';
    current.approvalDecisionAt = new Date().toISOString();
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    this.logActivity({
      workItemId: current.id,
      workItemTitle: current.title,
      action: 'APPROVED',
      details: note ? `Approved with note: "${note}"` : 'Approved request',
    });

    this.persist();
    return current;
  }

  rejectWorkItem(id, reason) {
    const index = this.workItems.findIndex((w) => w.id === id);
    if (index === -1) throw new ApiError(`Work item ${id} not found`, 404);

    const current = this.workItems[index];

    if (!reason || !reason.trim()) {
      throw new ApiError('A rejection reason is required.', 422, {
        detail: { reason: 'Rejection reason is mandatory.' },
      });
    }

    current.approvalStatus = APPROVAL_STATUS.REJECTED;
    current.rejectionReason = reason;
    current.approvedBy = this.currentUser?.id || 'usr-1';
    current.approvalDecisionAt = new Date().toISOString();
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    this.logActivity({
      workItemId: current.id,
      workItemTitle: current.title,
      action: 'REJECTED',
      details: `Rejected with reason: "${reason}"`,
    });

    this.persist();
    return current;
  }

  // --- Comments ---
  getComments(workItemId) {
    return this.comments.filter((c) => c.workItemId === workItemId);
  }

  addComment(workItemId, content) {
    if (!content || !content.trim()) {
      throw new ApiError('Comment cannot be empty', 422);
    }

    const newComment = {
      id: `cmt-${Date.now()}`,
      workItemId,
      authorId: this.currentUser?.id || 'usr-1',
      authorName: this.currentUser?.name || 'Authorized User',
      authorAvatar: this.currentUser?.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    this.comments.push(newComment);

    const item = this.workItems.find((w) => w.id === workItemId);
    this.logActivity({
      workItemId,
      workItemTitle: item?.title || workItemId,
      action: 'COMMENT_ADDED',
      details: `Added a comment: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
    });

    this.persist();
    return newComment;
  }

  // --- Teams ---
  getTeams() {
    return this.teams;
  }

  getTeamMembers(teamId) {
    return this.users.filter((u) => u.teamId === teamId);
  }

  updateMemberRole(teamId, userId, newRole) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new ApiError('User not found', 404);

    const oldRole = user.role;
    user.role = newRole;

    this.logActivity({
      workItemId: null,
      workItemTitle: 'Team Governance',
      action: 'ROLE_UPDATED',
      details: `Updated ${user.name}'s role from ${oldRole} to ${newRole}`,
    });

    this.persist();
    return user;
  }

  // --- Activity History ---
  getActivity(params = {}) {
    const { actorId = '', action = '' } = params;
    let list = [...this.activities];

    if (actorId) {
      list = list.filter((a) => a.actorId === actorId);
    }
    if (action) {
      list = list.filter((a) => a.action === action);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }

  logActivity({ workItemId, workItemTitle, action, details, actorId, actorName }) {
    const newAct = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workItemId: workItemId || null,
      workItemTitle: workItemTitle || null,
      actorId: actorId || this.currentUser?.id || 'usr-1',
      actorName: actorName || this.currentUser?.name || 'System Operator',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(newAct);
    // Keep max 200 activities
    if (this.activities.length > 200) {
      this.activities.pop();
    }
  }
}

export const mockStore = new MockStore();
