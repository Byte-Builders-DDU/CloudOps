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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner text="Authenticating CloudOps Session..." />
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
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar onOpenCopilot={() => setIsCopilotOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenCopilot={() => setIsCopilotOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ openChangeReview: handleOpenReview, openCopilot: () => setIsCopilotOpen(true) }} />
        </main>
      </div>

      {/* Global Slide-Out Change Review Drawer */}
      <ChangeReview
        isOpen={isReviewOpen}
        onClose={handleCloseReview}
        initialData={reviewInitialData}
      />

      {/* Global AI Operations Copilot Panel */}
      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onOpenReview={(draft) => {
          setIsCopilotOpen(false);
          handleOpenReview(draft);
        }}
      />
    </div>
  );
}
