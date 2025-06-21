import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInput } from './ChatInput';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';
import { Sidebar } from './Sidebar';
import { SidebarTrigger } from './SidebarTrigger';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../hooks/useProject';
import { LogIn } from 'lucide-react';
import icon from '../assets/icon.jpg';
import biglogo from '../assets/biglogo.png';
import bg from '../assets/bg.png';

export function LandingView() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { createNewProject } = useProject();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const sidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleSendMessage = async (content: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsCreatingProject(true);
    try {
      // Create new project and navigate to it
      await createNewProject(content);
      // Navigation happens automatically in createNewProject
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreatingProject(false);
    }
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
    setSidebarVisible(false);
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }
  };

  const handleSidebarMouseEnter = () => {
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }
  };

  const handleSidebarMouseLeave = () => {
    sidebarTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false);
      sidebarTimeoutRef.current = null;
    }, 300);
  };

  // Show loading state while checking authentication or creating project
  if (authLoading || isCreatingProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-onyx-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-onyx-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-onyx-text-secondary">
            {isCreatingProject ? 'Creating your project...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'bottom center',
      }}
    >
      {/* Sidebar Trigger */}
      <SidebarTrigger 
        onToggle={setSidebarVisible} 
        isVisible={sidebarVisible}
      />

      {/* Sidebar */}
      <Sidebar
        isVisible={sidebarVisible}
        onNewChat={() => {
          setSidebarVisible(false);
          if (sidebarTimeoutRef.current) {
            clearTimeout(sidebarTimeoutRef.current);
            sidebarTimeoutRef.current = null;
          }
        }}
        onSelectProject={handleSelectProject}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      />

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <header className="px-6 py-4 flex items-center justify-between relative z-30">
        <img src={icon} alt="App Icon" className="w-12 h-12 rounded-md" draggable="false" />
        
        {/* Auth Section - Only show if sidebar is not visible */}
        {!sidebarVisible && (
          <div className="flex items-center">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <button
                onClick={handleSignInClick}
                className="flex items-center gap-2 px-4 py-2 bg-onyx-primary text-white rounded-lg hover:bg-onyx-primary-hover transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full w-full flex-col items-center justify-start px-4">
          {/* Logo */}
          <div className="w-full max-w-md h-52 overflow-hidden">
            <img
              src={biglogo}
              alt="Big Logo"
              className="w-full h-full object-cover"
              draggable="false"
            />
          </div>

          {/* Chat input box */}
          <div className="w-full max-w-2xl">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isCreatingProject}
              hasGeneratedPage={false}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </div>
        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}