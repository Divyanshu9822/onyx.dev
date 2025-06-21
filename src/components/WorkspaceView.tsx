import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from './ChatInterface';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';
import { Sidebar } from './Sidebar';
import { SidebarTrigger } from './SidebarTrigger';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useProject } from '../hooks/useProject';
import { LogIn } from 'lucide-react';
import icon from '../assets/icon.jpg';
import bg from '../assets/bg.png';

export function WorkspaceView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { messages, isLoading, sendMessage, pageState, regenerateSection, getComposedPage, currentLoadingMessageId, loadProjectIntoChat, clearChat, startGenerationWithPrompt } = useChat();
  const { loadProject } = useProject();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const sidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  const hasMessages = messages.length > 0;

  // Load project when projectId changes
  useEffect(() => {
    if (projectId && isAuthenticated) {
      setIsLoadingProject(true);
      setProjectLoadError(null);
      
      loadProject(projectId)
        .then((project) => {
          if (project) {
            // Check if this is a new project (no HTML content yet)
            const isNewProject = !project.html && !project.css && !project.js;
            
            if (isNewProject) {
              // For new projects, start generation immediately
              // Don't change loading states here - let startGenerationWithPrompt handle it
              startGenerationWithPrompt(project.prompt);
            } else {
              // For existing projects, load the project into chat interface
              loadProjectIntoChat(project.prompt, {
                html: project.html,
                css: project.css,
                js: project.js
              });
            }
            setIsLoadingProject(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load project:', error);
          setProjectLoadError('Project not found or failed to load');
          setIsLoadingProject(false);
          // Redirect to home if project not found
          setTimeout(() => {
            navigate('/');
          }, 3000);
        });
    }
  }, [projectId, isAuthenticated, loadProject, loadProjectIntoChat, startGenerationWithPrompt, navigate]);


  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleRegenerateSection = async (sectionId: string) => {
    const userMessage = messages.find(m => m.type === 'user');
    if (userMessage && regenerateSection) {
      try {
        await regenerateSection(sectionId, userMessage.content);
      } catch (error) {
        console.error('Failed to regenerate section:', error);
      }
    }
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  const handleNewChat = () => {
    clearChat();
    navigate('/');
    setSidebarVisible(false);
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }
  };

  const handleSelectProject = (selectedProjectId: string) => {
    if (selectedProjectId !== projectId) {
      navigate(`/project/${selectedProjectId}`);
    }
    setSidebarVisible(false);
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }
  };

  const handleSidebarMouseEnter = () => {
    // Clear any pending hide timeout when mouse enters sidebar
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }
  };

  const handleSidebarMouseLeave = () => {
    // Close sidebar when mouse leaves with a small delay
    sidebarTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false);
      sidebarTimeoutRef.current = null;
    }, 300);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  // Show loading state while checking authentication or loading project
  if (authLoading || isLoadingProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-onyx-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-onyx-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-onyx-text-secondary">
            {isLoadingProject ? 'Preparing your workspace...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if project failed to load
  if (projectLoadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-onyx-bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-xl mx-auto mb-4 flex items-center justify-center border border-red-200">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <p className="text-lg font-medium mb-2 text-onyx-text-primary">Project Not Found</p>
          <p className="text-sm text-onyx-text-secondary mb-4">{projectLoadError}</p>
          <p className="text-xs text-onyx-text-secondary">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: hasMessages ? undefined : `url(${bg})`,
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
        onNewChat={handleNewChat}
        onSelectProject={handleSelectProject}
        currentProjectId={projectId}
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

      <header className={`px-6 py-4 flex items-center justify-between ${hasMessages ? 'border-b border-onyx-border bg-onyx-surface' : ''} relative z-30`}>
        <button onClick={handleLogoClick}>
          <img src={icon} alt="App Icon" className="w-12 h-12 rounded-md hover:opacity-80 transition-opacity" draggable="false" />
        </button>
        
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
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          pageState={pageState}
          onRegenerateSection={handleRegenerateSection}
          getComposedPage={getComposedPage}
          currentLoadingMessageId={currentLoadingMessageId}
        />
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}