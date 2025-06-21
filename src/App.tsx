import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingView } from './components/LandingView';
import { WorkspaceView } from './components/WorkspaceView';
import { AuthProvider } from './contexts/AuthContext';

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/project/:projectId" element={<WorkspaceView />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;