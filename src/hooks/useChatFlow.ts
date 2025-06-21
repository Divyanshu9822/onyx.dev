import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { usePageGeneration } from './usePageGeneration';
import { Message } from '../types';

export function useChatFlow() {
  const navigate = useNavigate();
  const {
    // Auth
    isAuthenticated,
    
    // Project
    createProject,
    updateProject,
    currentProject,
    
    // Chat
    addMessage,
    setLoading,
    setError,
    currentLoadingMessageId,
    
    // UI
    setShowAuthModal,
  } = useAppStore();

  const {
    pageState,
    generatePage,
    editSectionByPrompt,
    getComposedPage,
    hasGeneratedPage,
    restorePageStateFromFiles
  } = usePageGeneration();

  const sendMessage = useCallback(async (content: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to chat
    addMessage(userMessage);
    setLoading(true, 'loading-' + Date.now().toString());
    setError(null);

    try {
      // Only handle project creation/routing if we're on the home page
      const isOnHomePage = window.location.pathname === '/';
      if (isOnHomePage) {
        // Create project and navigate
        const project = await createProject(content);
        navigate(`/project/${project.id}`);
      }
      
      // Determine if this is an initial generation or an edit
      const isInitialGeneration = !hasGeneratedPage();
      
      if (isInitialGeneration) {
        // Initial page generation
        await generatePage(content);
        
        // Wait for generation to complete and handle success
        const handleGenerationComplete = async () => {
          try {
            const composedPage = await getComposedPage();
            
            // Update project in database
            if (currentProject) {
              await updateProject(composedPage, pageState.plan);
            }
            
            // Get list of successfully generated sections
            const generatedSections = pageState.sections.filter(s => s.isGenerated);
            const failedSections = pageState.sections.filter(s => !s.isGenerated);
            
            // Create success message
            let successMessage = `✅ Page generated successfully!\n`;
            successMessage += `Sections created: ${generatedSections.map(s => s.name).join(', ')}.\n`;
            
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

            addMessage(assistantMessage);
            setLoading(false);
          } catch (error) {
            console.error('Error getting composed page:', error);
            setError('Failed to format page content');
            setLoading(false);
          }
        };

        // Check for completion
        const checkCompletion = () => {
          if (!pageState.isPlanning && !pageState.isGenerating) {
            handleGenerationComplete();
          } else {
            setTimeout(checkCompletion, 500);
          }
        };
        checkCompletion();
      } else {
        // Edit existing page
        try {
          const editResult = await editSectionByPrompt(content);
          
          // Wait for edit to complete
          const handleEditComplete = async () => {
            try {
              const composedPage = await getComposedPage();
              
              // Update project in database
              if (currentProject) {
                await updateProject(composedPage, pageState.plan);
              }
              
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

              addMessage(assistantMessage);
              setLoading(false);
            } catch (error) {
              console.error('Error getting composed page after edit:', error);
              setError('Failed to format page content after edit');
              setLoading(false);
            }
          };

          // Check for edit completion
          const checkEditCompletion = () => {
            if (!pageState.isEditing && !pageState.sections.some(s => s.isGenerating)) {
              handleEditComplete();
            } else {
              setTimeout(checkEditCompletion, 500);
            }
          };
          checkEditCompletion();
        } catch (editError) {
          console.error('Error in edit flow:', editError);
          throw editError;
        }
      }
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
        timestamp: new Date(),
      };

      addMessage(errorMessage);
      setLoading(false);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [
    isAuthenticated,
    createProject,
    updateProject,
    currentProject,
    addMessage,
    setLoading,
    setError,
    setShowAuthModal,
    navigate,
    generatePage,
    editSectionByPrompt,
    getComposedPage,
    hasGeneratedPage,
    pageState
  ]);

  const loadProjectIntoChat = useCallback((prompt: string, files: { html: string; css: string; js: string }, pagePlan?: any) => {
    const { loadProjectIntoChat: loadIntoChat } = useAppStore.getState();
    
    // Restore page state so that hasGeneratedPage() returns true
    restorePageStateFromFiles(files, pagePlan);
    
    // Load into chat
    loadIntoChat(prompt, files, pagePlan);
  }, [restorePageStateFromFiles]);

  const startGenerationWithPrompt = useCallback(async (prompt: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setLoading(true, 'loading-' + Date.now().toString());

    try {
      await generatePage(prompt);
      // Completion will be handled by the generation flow
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
        timestamp: new Date(),
      };

      addMessage(errorMessage);
      setLoading(false);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [addMessage, setLoading, setError, generatePage]);

  return {
    sendMessage,
    loadProjectIntoChat,
    startGenerationWithPrompt,
    pageState,
    currentLoadingMessageId,
    getComposedPage
  };
}