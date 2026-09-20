import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CloudFilterProvider } from './hooks/useCloudFilter';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CursorGlow } from './components/common/CursorGlow';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Resources } from './pages/Resources';
import { ResourceDetail } from './pages/ResourceDetail';
import { Monitoring } from './pages/Monitoring';
import { Scaling } from './pages/Scaling';
import { Costs } from './pages/Costs';
import { Changes } from './pages/Changes';
import { Policies } from './pages/Policies';
import { Copilot } from './pages/Copilot';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <CursorGlow />
      <AuthProvider>
        <CloudFilterProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Platform Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/:id" element={<ResourceDetail />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/scaling" element={<Scaling />} />
              <Route path="/recommendations" element={<Navigate to="/scaling" replace />} />
              <Route path="/costs" element={<Costs />} />
              <Route path="/changes" element={<Changes />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/audit" element={<Navigate to="/audit-logs" replace />} />
              <Route path="/settings" element={<Settings />} />

              {/* Workspace Scoped Routes /w/:slug/* */}
              <Route path="/w/:slug/overview" element={<Dashboard />} />
              <Route path="/w/:slug/resources" element={<Resources />} />
              <Route path="/w/:slug/monitoring" element={<Monitoring />} />
              <Route path="/w/:slug/recommendations" element={<Scaling />} />
              <Route path="/w/:slug/costs" element={<Costs />} />
              <Route path="/w/:slug/changes" element={<Changes />} />
              <Route path="/w/:slug/policies" element={<Policies />} />
              <Route path="/w/:slug/copilot" element={<Copilot />} />
              <Route path="/w/:slug/audit" element={<AuditLogs />} />
              <Route path="/w/:slug/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CloudFilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
