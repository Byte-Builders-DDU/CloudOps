import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CloudFilterProvider } from './hooks/useCloudFilter';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Resources } from './pages/Resources';
import { ResourceDetail } from './pages/ResourceDetail';
import { Monitoring } from './pages/Monitoring';
import { Scaling } from './pages/Scaling';
import { Costs } from './pages/Costs';
import { Policies } from './pages/Policies';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CloudFilterProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Enterprise Platform Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/:id" element={<ResourceDetail />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/scaling" element={<Scaling />} />
              <Route path="/costs" element={<Costs />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
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
