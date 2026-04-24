import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import Login from '../pages/Login';
import ProjectsHome from '../pages/ProjectsHome';
import ProjectDashboard from '../pages/ProjectDashboard';
import StageBoard from '../pages/StageBoard';
import TopicDetail from '../pages/TopicDetail';
import FilesGallery from '../pages/FilesGallery';
import Reports from '../pages/Reports';
import AdminPanel from '../pages/AdminPanel';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected App Routes */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<ProjectsHome />} />
          <Route path="/projects/:projectId" element={<ProjectDashboard />} />
          <Route path="/projects/:projectId/stages/:stageId" element={<StageBoard />} />
          <Route path="/projects/:projectId/topics/:topicId" element={<TopicDetail />} />
          <Route path="/projects/:projectId/files" element={<FilesGallery />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
