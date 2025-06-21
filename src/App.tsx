import React, { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useChat } from './hooks/useChat';
import { LogIn } from 'lucide-react';
import icon from './assets/icon.jpg';
import bg from './assets/bg.png'; 

function AppContent() {
  const { messages, isLoading, sendMessage, pageState, regenerateSection, getComposedPage, currentLoadingMessageId } = useChat();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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
      <header className={`px-6 py-4 flex items-center justify-between ${hasMessages ? 'border-b border-onyx-border bg-onyx-surface' : ''}`}>
        <img src={icon} alt="App Icon" className="w-12 h-12 rounded-md" draggable="false" />
        
        {/* Auth Section */}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;