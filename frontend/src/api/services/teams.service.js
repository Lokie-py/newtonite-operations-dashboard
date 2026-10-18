
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const teamsService = {
  async getTeams() {
    return apiClient.get(API_ENDPOINTS.TEAMS.LIST);
  },

  async getTeamMembers(teamId) {
    return apiClient.get(API_ENDPOINTS.TEAMS.MEMBERS(teamId));
  },

  async updateMemberRole(teamId, userId, role) {
    return apiClient.patch(
      API_ENDPOINTS.TEAMS.UPDATE_MEMBER_ROLE(teamId, userId),
      { role }
    );
  },
};
