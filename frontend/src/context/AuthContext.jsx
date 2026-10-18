import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { authService, isMockMode } from "../api";
import { mockStore } from "../mock/mockStore";
import { USER_ROLE } from "../utils/constants";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    id: user.id,
    name: user.name || user.full_name || user.email,
    teamId: user.teamId ?? user.team_id ?? null,
    isActive: user.isActive ?? user.is_active ?? true,
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();
      setCurrentUser(normalizeUser(user));
    } catch (err) {
      if (err.status !== 401) {
        setError(err.userMessage || "Failed to authenticate");
      }

      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleModeChange = () => {
      fetchCurrentUser();
    };

    window.addEventListener("newtonite_api_mode_change", handleModeChange);

    return () => {
      window.removeEventListener("newtonite_api_mode_change", handleModeChange);
    };
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.login(email, password);
      const normalizedUser = normalizeUser(user);

      setCurrentUser(normalizedUser);

      return normalizedUser;
    } catch (err) {
      setError(err.userMessage || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout error; clearing local user state", err);
    } finally {
      setCurrentUser(null);
    }
  };

  const switchDemoUser = (userId) => {
    if (isMockMode()) {
      const user = mockStore.setCurrentUser(userId);
      setCurrentUser(normalizeUser(user));
    }
  };

  const isAdmin = currentUser?.role === USER_ROLE.ADMIN;

  const isManager = currentUser?.role === USER_ROLE.MANAGER || isAdmin;

  const isMember = currentUser?.role === USER_ROLE.MEMBER;

  const canApprove = (item) => {
    if (!item?.requiresApproval) return false;
    if (isAdmin) return true;

    if (isManager && item.requiredApproverRole !== USER_ROLE.ADMIN) {
      return true;
    }

    return false;
  };

  const canManageRoles = isAdmin;

  const canEditWorkItem = (item) => {
    if (!currentUser || !item) return false;

    // Keep role- and ownership-based checks in mock/demo mode.
    if (isMockMode()) {
      if (isAdmin || isManager) return true;

      return (
        String(item.assigneeId) === String(currentUser.id) ||
        (item.teamId != null &&
          currentUser.teamId != null &&
          String(item.teamId) === String(currentUser.teamId))
      );
    }

    // In live mode, show the edit action to authenticated users.
    // The backend must still validate team membership on every update.
    return true;
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    switchDemoUser,
    isAdmin,
    isManager,
    isMember,
    canApprove,
    canManageRoles,
    canEditWorkItem,
    isAuthenticated: Boolean(currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
