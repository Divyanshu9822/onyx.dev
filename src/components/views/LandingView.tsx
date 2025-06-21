import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useChatFlow } from '../../hooks/useChatFlow';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { SidebarTrigger } from '../common/SidebarTrigger';
import { AuthModal } from '../common/AuthModal';
import { ChatInput } from '../chat/ChatInput';
import { LogIn } from 'lucide-react';
import biglogo from '../../assets/biglogo.png';
import bg from '../../assets/bg.png';

export function LandingView() {
  const navigate = useNavigate();
  const sidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    // Auth
    isAuthenticated,
    loading: authLoading,
    
    // UI
    sidebarVisible,
    showAuthModal,
    setSidebarVisible,
    setShowAuthModal,
    
    // Project
    createProject,
  } = useAppStore();

  const { sendMessage } = useChatFlow();

  const [isCreatingProject, setIsCreatingProject] = React.useState(false);

  const handleSendMessage = async (content: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsCreatingProject(true);
    try {
      // Create new project and navigate to it
      const project = await createProject(content);
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreatingProject(false);
    }
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

      <Header 
        showAuth={!sidebarVisible}
        onSignInClick={() => setShowAuthModal(true)}
      />

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