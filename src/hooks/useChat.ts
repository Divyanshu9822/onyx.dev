import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { generateWebFiles } from '../services/geminiApi';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const generatedFiles = await generateWebFiles(content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I\'ve generated a beautiful web application with separate HTML, CSS, and JavaScript files.',
        timestamp: new Date(),
        generatedFiles,
      };

      setState(prev => ({
        ...prev,
        messages: [userMessage, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred while generating the files.',
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [userMessage, errorMessage],
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, []);

  return {
    ...state,
    sendMessage,
  };
}