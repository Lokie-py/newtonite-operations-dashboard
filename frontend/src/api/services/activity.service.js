
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const activityService = {
  async getActivity(params = {}) {
    const { workItemId, work_item_id, ...filters } = params;
    const itemId = workItemId ?? work_item_id;

    // Fetch activity for one specific work item.
    if (itemId !== undefined && itemId !== null && itemId !== '') {
      return apiClient.get(
        `/work-items/${encodeURIComponent(itemId)}/activities/`
      );
    }

    // Fetch the global activity feed.
    return apiClient.get('/activities/', {
      params: filters,
    });
  },
};
