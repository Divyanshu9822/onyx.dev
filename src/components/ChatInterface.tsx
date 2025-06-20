import React from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { WorkspaceInterface } from './WorkspaceInterface';
import { Message } from '../types';
import biglogo from '../assets/biglogo.png';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  pageState?: any;
  onRegenerateSection?: (sectionId: string) => void;
  getComposedPage?: () => any;
}

export function ChatInterface({ 
  messages, 
  isLoading, 
  onSendMessage, 
  pageState, 
  onRegenerateSection,
  getComposedPage 
}: ChatInterfaceProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;
  const latestMessage = messages[messages.length - 1];
  const hasGeneratedFiles = latestMessage?.type === 'assistant' && latestMessage.generatedFiles;
  const hasGeneratedPage = messages.some(m => m.type === 'assistant' && m.generatedFiles);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!hasMessages && !isLoading) {
    return (
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
          />
        </div>
      </div>
    );
  }

  // Workspace view - split layout with chat and editor/preview
  return (
    <div className="h-full flex">
      {/* Left Panel - Chat History */}
      <div className="w-2/5 bg-onyx-surface border-r border-onyx-border flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 bg-onyx-bg-primary">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                pageState={pageState}
                onRegenerateSection={onRegenerateSection}
              />
            ))}
            {(isLoading || (pageState && (pageState.isPlanning || pageState.isGenerating || pageState.isEditing))) && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-full w-full">
                  {pageState ? (
                    <MessageBubble 
                      message={{
                        id: 'generating',
                        type: 'assistant',
                        content: '',
                        timestamp: new Date()
                      }}
                      pageState={pageState}
                    />
                  ) : (
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
                  )}
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
          />
        </div>
      </div>

      {/* Right Panel - Workspace */}
      <div className="flex-1 bg-onyx-bg-secondary flex flex-col">
        {hasGeneratedFiles && getComposedPage ? (
          <WorkspaceInterface 
            generatedFiles={getComposedPage()} 
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
  );
}