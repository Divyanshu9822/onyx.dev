import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  // const suggestions = [
  //   "A modern portfolio website with smooth animations",
  //   "A SaaS landing page with pricing tiers and testimonials",
  //   "A restaurant website with menu and online ordering",
  //   "A fitness app dashboard with progress tracking"
  // ];

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the landing page you want to create..."
            className="w-full p-4 pr-16 min-h-40 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
            
          {/* Quick Suggestions - Only show when no message and not in workspace */}
          {/* {!message && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(suggestion)}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {suggestion}
                </button>
              ))}
            </div>
          )} */}
          {/* Conditionally render Send button only when there's a message */}
          {message.trim().length > 0 && (
            <button
              type="submit"
              disabled={isLoading}
              className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}