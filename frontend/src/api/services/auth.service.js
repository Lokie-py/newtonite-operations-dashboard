
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

const TOKEN_KEY = 'newtonite_access_token';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );

    if (!response?.access_token) {
      throw new Error('Login response did not contain an access token.');
    }

    localStorage.setItem(TOKEN_KEY, response.access_token);

    try {
      return await this.getCurrentUser();
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      throw error;
    }
  },

  async logout() {
    // The current backend has no logout endpoint.
    // Remove the locally stored JWT to end this browser session.
    localStorage.removeItem(TOKEN_KEY);
    return null;
  },

  async getCurrentUser() {
    return apiClient.get(API_ENDPOINTS.AUTH.ME);
  },
};
