import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { usePageGeneration } from './usePageGeneration';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentLoadingMessageId: null,
  });

  const { pageState, generatePage, regenerateSection, editSectionByPrompt, getComposedPage, hasGeneratedPage } = usePageGeneration();

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to chat
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      currentLoadingMessageId: 'loading-' + Date.now().toString(),
    }));

    try {
      // Determine if this is an initial generation or an edit
      const isInitialGeneration = !hasGeneratedPage();

      if (isInitialGeneration) {
        // Initial page generation
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
              messages: [...prev.messages.slice(0, -1), userMessage, assistantMessage],
              isLoading: false,
              currentLoadingMessageId: null,
            }));
          } else {
            // Check again in 500ms
            setTimeout(checkCompletion, 500);
          }
        };

        checkCompletion();
      } else {
        // Edit existing page
        const editResult = await editSectionByPrompt(content);
        
        // Wait for edit to complete
        const checkEditCompletion = () => {
          if (!pageState.isEditing && !pageState.sections.some(s => s.isGenerating)) {
            const composedPage = getComposedPage();
            
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: `I've updated the ${editResult.sectionName} section based on your request: "${editResult.changeDescription}". The changes have been applied and are now visible in the preview.`,
              timestamp: new Date(),
              generatedFiles: composedPage,
              editResult: editResult,
            };

            setState(prev => ({
              ...prev,
              messages: [...prev.messages.slice(0, -1), userMessage, assistantMessage],
              isLoading: false,
              currentLoadingMessageId: null,
            }));
          } else {
            // Check again in 500ms
            setTimeout(checkEditCompletion, 500);
          }
        };

        checkEditCompletion();
      }
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(0, -1), userMessage, errorMessage],
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        currentLoadingMessageId: null,
      }));
    }
  }, [generatePage, editSectionByPrompt, pageState, getComposedPage, hasGeneratedPage]);

  return {
    ...state,
    sendMessage,
    pageState,
    regenerateSection,
    getComposedPage,
    currentLoadingMessageId: state.currentLoadingMessageId
  };
}