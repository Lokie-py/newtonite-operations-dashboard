
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

const normalizeStatus = (value) =>
  String(value || 'open')
    .toLowerCase()
    .replaceAll(' ', '_');

const normalizePriority = (value) => {
  const normalized = String(value || 'medium').toLowerCase();
  return normalized === 'critical' ? 'urgent' : normalized;
};

const normalizeWorkItem = (item) => ({
  ...item,
  teamId: item.teamId ?? item.team_id,
  assigneeId: item.assigneeId ?? item.assigned_to_id,
  createdById: item.createdById ?? item.created_by_id,
  updatedAt: item.updatedAt ?? item.updated_at,
  createdAt: item.createdAt ?? item.created_at,
});

export const workItemsService = {
  async getWorkItems(params = {}) {
    const {
      search = '',
      status = '',
      priority = '',
      teamId = '',
      assigneeId = '',
      page = 1,
      pageSize = 10,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const query = {
      search,
      status: status ? normalizeStatus(status) : '',
      priority: priority ? normalizePriority(priority) : '',
      team_id: teamId || undefined,
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
      sortBy,
      sortOrder,
    };

    // Assignee filtering is not currently supported by the backend.
    void assigneeId;

    const response = await apiClient.get(
      API_ENDPOINTS.WORK_ITEMS.LIST,
      { params: query }
    );

    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
        ? response.items
        : [];

    const normalizedItems = items.map(normalizeWorkItem);
    const total = response?.total ?? normalizedItems.length;

    return {
      items: normalizedItems,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / Number(pageSize))
      ),
    };
  },

  async getWorkItemById(id) {
    const item = await apiClient.get(
      API_ENDPOINTS.WORK_ITEMS.DETAIL(id)
    );

    return normalizeWorkItem(item);
  },

  async createWorkItem(data) {
    const payload = {
      title: String(data.title || '').trim(),
      description: data.description || null,
      status: normalizeStatus(data.status),
      priority: normalizePriority(data.priority),
      team_id: Number(data.teamId ?? data.team_id),
      assigned_to_id:
        data.assigneeId == null || data.assigneeId === ''
          ? null
          : Number(data.assigneeId ?? data.assigned_to_id),
    };

    if (!payload.title) {
      throw new Error('Work item title is required.');
    }

    if (!Number.isInteger(payload.team_id) || payload.team_id <= 0) {
      throw new Error('Please select a valid team.');
    }

    if (
      payload.assigned_to_id !== null &&
      (!Number.isInteger(payload.assigned_to_id) ||
        payload.assigned_to_id <= 0)
    ) {
      throw new Error('Please select a valid assignee.');
    }

    const created = await apiClient.post(
      API_ENDPOINTS.WORK_ITEMS.CREATE,
      payload
    );

    return normalizeWorkItem(created);
  },

  async updateWorkItem(id, data, version) {
    const payload = {
      expected_version: version,
    };

    if (data.title !== undefined) {
      payload.title = String(data.title).trim();
    }

    if (data.description !== undefined) {
      payload.description = data.description;
    }

    if (data.status !== undefined) {
      payload.status = normalizeStatus(data.status);
    }

    if (data.priority !== undefined) {
      payload.priority = normalizePriority(data.priority);
    }

    if (data.teamId !== undefined || data.team_id !== undefined) {
      payload.team_id = Number(data.teamId ?? data.team_id);
    }

    if (data.assigneeId !== undefined || data.assigned_to_id !== undefined) {
      const assignee = data.assigneeId ?? data.assigned_to_id;
      payload.assigned_to_id =
        assignee === '' || assignee == null
          ? null
          : Number(assignee);
    }

    const updated = await apiClient.patch(
      API_ENDPOINTS.WORK_ITEMS.UPDATE(id),
      payload
    );

    return normalizeWorkItem(updated);
  },

  async transitionStatus(id, status, version) {
    return this.updateWorkItem(
      id,
      { status: normalizeStatus(status) },
      version
    );
  },

  async assignWorkItem(id, assigneeId, version) {
    return this.updateWorkItem(
      id,
      { assigneeId },
      version
    );
  },

  async changePriority(id, priority, version) {
    return apiClient.post(
      API_ENDPOINTS.WORK_ITEMS.UPDATE_PRIORITY(id),
      {
        priority: normalizePriority(priority),
        expected_version: version,
      }
    ).then(normalizeWorkItem);
  },

  async simulateConflict(id, data, staleVersion) {
    return this.updateWorkItem(id, data, staleVersion);
  },
};
