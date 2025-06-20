import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { useChat } from './hooks/useChat';
import icon from './assets/icon.jpg';
import bg from './assets/bg.png'; 

function App() {
  const { messages, isLoading, sendMessage, pageState, regenerateSection, getComposedPage, currentLoadingMessageId } = useChat();
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

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: hasMessages ? undefined : `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'bottom center',
      }}
    >
      <header className={`px-6 py-4 ${hasMessages ? 'border-b border-onyx-border bg-onyx-surface' : ''}`}>
        <img src={icon} alt="App Icon" className="w-12 h-12 rounded-md" draggable="false" />
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
    </div>
  );
}

export default App;