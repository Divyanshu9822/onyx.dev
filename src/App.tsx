import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { useChat } from './hooks/useChat';
import icon from './assets/icon.jpg';
import bg from './assets/bg.png'; 

function App() {
  const { messages, isLoading, sendMessage } = useChat();
  const hasMessages = messages.length > 0;

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
        />
      </main>
    </div>
  );
}

export default App;