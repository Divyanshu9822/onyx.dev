import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { Sidebar } from './components/Sidebar';
import { SidebarTrigger } from './components/SidebarTrigger';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useChat } from './hooks/useChat';
import { useProject } from './hooks/useProject';
import { LogIn } from 'lucide-react';
import icon from './assets/icon.jpg';
import bg from './assets/bg.png'; 

function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { messages, isLoading, sendMessage, pageState, regenerateSection, getComposedPage, currentLoadingMessageId, loadProjectIntoChat, clearChat } = useChat();
  const { currentProject, loadProject, startNewChat } = useProject();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const navigate = useNavigate();
  
  const hasMessages = messages.length > 0;

  // Load project when projectId changes
  useEffect(() => {
    if (projectId && isAuthenticated) {
      setIsLoadingProject(true);
      loadProject(projectId)
        .then((project) => {
          if (project) {
            // Load the project into chat interface
            loadProjectIntoChat(project.prompt, {
              html: project.html,
              css: project.css,
              js: project.js
            });
          }
        })
        .catch((error) => {
          console.error('Failed to load project:', error);
          // Redirect to home if project not found
          navigate('/');
        })
        .finally(() => {
          setIsLoadingProject(false);
        });
    }
  }, [projectId, isAuthenticated, loadProject, loadProjectIntoChat, navigate]);

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
    startNewChat();
    setSidebarVisible(false);
  };

  const handleSelectProject = (selectedProjectId: string) => {
    if (selectedProjectId !== projectId) {
      navigate(`/project/${selectedProjectId}`);
    }
    setSidebarVisible(false);
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
          <p className="text-onyx-text-secondary">Loading...</p>
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

function HomePage() {
  const { messages, isLoading, sendMessage, pageState, regenerateSection, getComposedPage, currentLoadingMessageId, clearChat } = useChat();
  const { startNewChat } = useProject();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();
  
  const hasMessages = messages.length > 0;

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
    startNewChat();
    setSidebarVisible(false);
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
    setSidebarVisible(false);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-onyx-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-onyx-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-onyx-text-secondary">Loading...</p>
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
      />

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <header className={`px-6 py-4 flex items-center justify-between ${hasMessages ? 'border-b border-onyx-border bg-onyx-surface' : ''} relative z-30`}>
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

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
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