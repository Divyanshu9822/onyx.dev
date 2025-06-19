import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { usePageGeneration } from './usePageGeneration';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const { pageState, generatePage, regenerateSection, getComposedPage } = usePageGeneration();

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
      await generatePage(content);
      
      // Wait for generation to complete
      const checkCompletion = () => {
        if (!pageState.isPlanning && !pageState.isGenerating) {
          const composedPage = getComposedPage();
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I've created your landing page with ${pageState.sections.length} sections: ${pageState.sections.map(s => s.name).join(', ')}. Each section was carefully crafted to match your requirements.`,
            timestamp: new Date(),
            generatedFiles: composedPage,
            pagePlan: pageState.plan,
          };

          setState(prev => ({
            ...prev,
            messages: [userMessage, assistantMessage],
            isLoading: false,
          }));
        } else {
          // Check again in 500ms
          setTimeout(checkCompletion, 500);
        }
      };

      checkCompletion();
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred while generating the landing page.',
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [userMessage, errorMessage],
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, [generatePage, pageState, getComposedPage]);

  return {
    ...state,
    sendMessage,
    pageState,
    regenerateSection,
    getComposedPage
  };
}