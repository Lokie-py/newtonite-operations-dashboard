import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const commentsService = {
  async getComments(workItemId) {
    return apiClient.get(API_ENDPOINTS.WORK_ITEMS.COMMENTS(workItemId));
  },

  async addComment(workItemId, content) {
    return apiClient.post(API_ENDPOINTS.WORK_ITEMS.COMMENTS(workItemId), { content });
  },
};
