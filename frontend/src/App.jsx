import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { AllWorkItemsPage } from './pages/AllWorkItemsPage';
import { WorkItemDetailPage } from './pages/WorkItemDetailPage';
import { CreateWorkItemPage } from './pages/CreateWorkItemPage';
import { EditWorkItemPage } from './pages/EditWorkItemPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { TeamWorkPage } from './pages/TeamWorkPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="my-tasks" element={<MyTasksPage />} />
            <Route path="work-items" element={<AllWorkItemsPage />} />
            <Route path="work-items/new" element={<CreateWorkItemPage />} />
            <Route path="work-items/:id" element={<WorkItemDetailPage />} />
            <Route path="work-items/:id/edit" element={<EditWorkItemPage />} />
            <Route path="team-work" element={<TeamWorkPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="activity" element={<ActivityHistoryPage />} />
            <Route path="teams" element={<TeamManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
