import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAppStore } from '../../store';
import { LandingView } from '../views/LandingView';
import { WorkspaceView } from '../views/WorkspaceView';

export function AppLayout() {
  const { initializeAuth } = useAppStore();

  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/project/:projectId" element={<WorkspaceView />} />
      </Routes>
    </Router>
  );
}