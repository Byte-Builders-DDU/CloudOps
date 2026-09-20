import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChangeReview } from '../components/changes/ChangeReview';
import { CopilotPanel } from '../components/copilot/CopilotPanel';

export function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewInitialData, setReviewInitialData] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050B1A' }}>
        <div className="text-center space-y-4">
          {/* Animated logo */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 animate-pulse" style={{ boxShadow: '0 0 40px rgba(59,130,246,0.4)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-mono animate-pulse">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleOpenReview = (data = null) => {
    setReviewInitialData(data);
    setIsReviewOpen(true);
  };

  const handleCloseReview = () => {
    setIsReviewOpen(false);
    setReviewInitialData(null);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050B1A' }}>
      {/* Sidebar */}
      <Sidebar onOpenCopilot={() => setIsCopilotOpen(true)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenCopilot={() => setIsCopilotOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 page-enter"
          style={{
            background: 'radial-gradient(ellipse at 70% 0%, rgba(59,130,246,0.04) 0%, transparent 50%), #050B1A'
          }}
        >
          <Outlet context={{ openChangeReview: handleOpenReview, openCopilot: () => setIsCopilotOpen(true) }} />
        </main>
      </div>

      {/* Drawers */}
      <ChangeReview isOpen={isReviewOpen} onClose={handleCloseReview} initialData={reviewInitialData} />
      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onOpenReview={(draft) => { setIsCopilotOpen(false); handleOpenReview(draft); }}
      />
    </div>
  );
}
