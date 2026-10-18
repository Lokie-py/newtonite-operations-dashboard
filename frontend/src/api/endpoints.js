
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Work Items
  WORK_ITEMS: {
    LIST: '/work-items/',
    CREATE: '/work-items/',
    DETAIL: (id) => `/work-items/${id}`,
    UPDATE: (id) => `/work-items/${id}`,
    TRANSITION: (id) => `/work-items/${id}/transition`,
    ASSIGN: (id) => `/work-items/${id}/assign`,
    PRIORITY: (id) => `/work-items/${id}/priority`,
    COMMENTS: (id) => `/work-items/${id}/comments`,
    SIMULATE_CONFLICT: (id) => `/work-items/${id}/simulate-conflict`,
  },

  // Approvals

APPROVALS: {
  LIST: '/approvals/',
  DECISION: (id) => `/approvals/${id}/decision`,
},


  // Teams
TEAMS: {
  LIST: '/teams/',
  MEMBERS: (teamId) => `/teams/${teamId}/members`,
  UPDATE_MEMBER_ROLE: (teamId, userId) =>
    `/teams/${teamId}/members/${userId}/role`,
},

  // Activity & Audit Log
  ACTIVITY: {
    LIST: '/activities/',
  },

  // Health check
  HEALTH: '/health',
};
