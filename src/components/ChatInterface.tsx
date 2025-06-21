import React from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { WorkspaceInterface } from './WorkspaceInterface';
import { AuthModal } from './AuthModal';
import { Message, PageState, GeneratedFiles } from '../types';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import biglogo from '../assets/biglogo.png';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  pageState?: PageState;
  onRegenerateSection?: (sectionId: string) => void;
  getComposedPage?: () => Promise<GeneratedFiles>;
  currentLoadingMessageId?: string | null;
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  pageState,
  onRegenerateSection,
  getComposedPage,
  currentLoadingMessageId
}: ChatInterfaceProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [composedFiles, setComposedFiles] = useState<GeneratedFiles | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const hasMessages = messages.length > 0;
  const latestMessage = messages[messages.length - 1];
  const hasGeneratedFiles = latestMessage?.type === 'assistant' && latestMessage.generatedFiles;
  const hasGeneratedPage = messages.some(m => m.type === 'assistant' && m.generatedFiles);

  // Fetch composed page when needed
  useEffect(() => {
    if (hasGeneratedFiles && getComposedPage) {
      const fetchComposedPage = async () => {
        try {
          const files = await getComposedPage();
          setComposedFiles(files);
        } catch (error) {
          console.error('Error fetching composed page:', error);
        }
      };
      
      fetchComposedPage();
    }
  }, [hasGeneratedFiles, getComposedPage]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  // Close auth modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, showAuthModal]);

  if (!hasMessages && !isLoading) {
    return (
      <>
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
              onSendMessage={onSendMessage} 
              isLoading={isLoading}
              hasGeneratedPage={hasGeneratedPage}
              onAuthRequired={handleAuthRequired}
            />
          </div>
        </div>

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    );
  }

  // Workspace view - split layout with chat and editor/preview
  return (
    <>
      <div className="h-full flex">
        {/* Left Panel - Chat History */}
        <div className="w-2/5 bg-onyx-surface border-r border-onyx-border flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6 bg-onyx-bg-primary">
              {messages.map((message, index) => {
                // For edit flows, show pageState on the last assistant message if we're loading
                const shouldShowPageState = message.id === currentLoadingMessageId ||
                  (isLoading && message.type === 'assistant' && index === messages.length - 1);
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    pageState={shouldShowPageState ? pageState : undefined}
                    onRegenerateSection={onRegenerateSection}
                  />
                );
              })}
              {/* Show loading indicator only if we don't have a specific message to update */}
              {(isLoading && !currentLoadingMessageId) && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-full w-full">
                    <div className="bg-onyx-surface p-4 rounded-2xl rounded-tl-md shadow-sm border border-onyx-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-onyx-text-secondary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-onyx-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-onyx-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="ml-2 text-onyx-text-secondary text-sm">
                          {hasGeneratedPage ? 'Processing your changes...' : 'Generating your web application...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Show current loading message if we have a specific message ID */}
              {currentLoadingMessageId && !messages.some(m => m.id === currentLoadingMessageId) && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-full w-full">
                    <MessageBubble
                      message={{
                        id: currentLoadingMessageId,
                        type: 'assistant',
                        content: '',
                        timestamp: new Date()
                      }}
                      pageState={pageState}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="flex-shrink-0 border-t border-onyx-border bg-onyx-bg-primary">
            <ChatInput 
              onSendMessage={onSendMessage} 
              isLoading={isLoading}
              hasGeneratedPage={hasGeneratedPage}
              onAuthRequired={handleAuthRequired}
            />
          </div>
        </div>

        {/* Right Panel - Workspace */}
        <div className="flex-1 bg-onyx-bg-secondary flex flex-col">
          {hasGeneratedFiles && composedFiles ? (
            <WorkspaceInterface
              generatedFiles={composedFiles}
              pageState={pageState}
              onRegenerateSection={onRegenerateSection}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-onyx-text-secondary">
                <div className="w-16 h-16 bg-onyx-bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center border border-onyx-border">
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-lg font-medium mb-2 text-onyx-text-primary">Ready to generate</p>
                <p className="text-sm">Your code and preview will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}