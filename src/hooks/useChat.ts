import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { usePageGeneration } from './usePageGeneration';
import { useProject } from './useProject';
import { useProjectFlow } from './useProjectFlow';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentLoadingMessageId: null,
  });

  const { pageState, generatePage, regenerateSection, editSectionByPrompt, getComposedPage, hasGeneratedPage } = usePageGeneration();
  const { updateProject, currentProject } = useProject();
  const { handlePromptSubmission } = useProjectFlow();

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
      // Handle project creation/routing first if needed
      await handlePromptSubmission(content);
      
      // Determine if this is an initial generation or an edit
      const isInitialGeneration = !hasGeneratedPage();

      if (isInitialGeneration) {
        // Initial page generation
        await generatePage(content);
        
        // Wait for generation to complete
        const checkCompletion = () => {
          if (!pageState.isPlanning && !pageState.isGenerating) {
            const fetchComposedPage = async () => {
              try {
                const composedPage = await getComposedPage();
                
                // Update project in database (project already exists from handlePromptSubmission)
                try {
                  if (currentProject) {
                    await updateProject(composedPage);
                  }
                } catch (saveError) {
                  console.warn('Failed to update project:', saveError);
                  // Continue with UI update even if save fails
                }
                
                // Get list of successfully generated sections
                const generatedSections = pageState.sections.filter(s => s.isGenerated);
                const failedSections = pageState.sections.filter(s => !s.isGenerated);
                
                // Create a more detailed success message
                let successMessage = `✅ Page generated successfully!\n`;
                successMessage += `Sections created: ${generatedSections.map(s => s.name).join(', ')}.\n`;
                
                // Add information about failed sections if any
                if (failedSections.length > 0) {
                  successMessage += `\n⚠️ Some sections failed to generate: ${failedSections.map(s => s.name).join(', ')}.\n`;
                  successMessage += `You can try regenerating these sections individually.`;
                }
                
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  type: 'assistant',
                  content: successMessage,
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
              } catch (error) {
                console.error('Error getting composed page:', error);
                setState(prev => ({
                  ...prev,
                  isLoading: false,
                  currentLoadingMessageId: null,
                  error: 'Failed to format page content'
                }));
              }
            };
            
            fetchComposedPage();
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
            const fetchComposedPage = async () => {
              try {
                const composedPage = await getComposedPage();
                
                // Update project in database
                try {
                  if (currentProject) {
                    await updateProject(composedPage);
                  }
                } catch (saveError) {
                  console.warn('Failed to update project:', saveError);
                  // Continue with UI update even if save fails
                }
                
                // Create a more detailed edit success message
                let editSuccessMessage = `✅ Changes applied successfully!\n`;
                editSuccessMessage += `Updated the "${editResult.sectionName}" section based on your request: "${editResult.changeDescription}".\n`;
                editSuccessMessage += `The changes are now visible in the preview.`;
                
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  type: 'assistant',
                  content: editSuccessMessage,
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
              } catch (error) {
                console.error('Error getting composed page after edit:', error);
                setState(prev => ({
                  ...prev,
                  isLoading: false,
                  currentLoadingMessageId: null,
                  error: 'Failed to format page content after edit'
                }));
              }
            };
            
            fetchComposedPage();
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
  }, [generatePage, editSectionByPrompt, pageState, getComposedPage, hasGeneratedPage, handlePromptSubmission, updateProject, currentProject]);

  const loadProjectIntoChat = useCallback((prompt: string, files: { html: string; css: string; js: string }) => {
    // Clear current state
    setState({
      messages: [],
      isLoading: false,
      error: null,
      currentLoadingMessageId: null,
    });

    // Only show messages if there are actual files (not empty project)
    if (files.html || files.css || files.js) {
      // Create initial messages to show the project was loaded
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: prompt,
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '✅ Project loaded successfully! You can continue editing or make changes to your landing page.',
        timestamp: new Date(),
        generatedFiles: files,
      };

      setState({
        messages: [userMessage, assistantMessage],
        isLoading: false,
        error: null,
        currentLoadingMessageId: null,
      });
    }
  }, []);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      currentLoadingMessageId: null,
    });
  }, []);

  return {
    ...state,
    sendMessage,
    loadProjectIntoChat,
    clearChat,
    pageState,
    regenerateSection,
    getComposedPage,
    currentLoadingMessageId: state.currentLoadingMessageId
  };
}