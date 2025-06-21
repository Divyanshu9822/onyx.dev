import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useProject } from './useProject';
import { useAuth } from '../contexts/AuthContext';

export function useProjectFlow() {
  const location = useLocation();
  const { createNewProject, currentProject } = useProject();
  const { isAuthenticated } = useAuth();

  const isHomePage = location.pathname === '/';
  const isProjectPage = location.pathname.startsWith('/project/');

  const handlePromptSubmission = useCallback(async (prompt: string) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated');
    }

    if (isHomePage) {
      // On home page: create new project first, then navigate
      const project = await createNewProject(prompt);
      // Navigation happens automatically in createNewProject
      return { projectId: project.id, isNewProject: true };
    } else if (isProjectPage) {
      // On project page: continue with existing project
      return { projectId: currentProject?.id, isNewProject: false };
    }

    throw new Error('Invalid page context');
  }, [isAuthenticated, isHomePage, isProjectPage, createNewProject, currentProject]);

  return {
    isHomePage,
    isProjectPage,
    handlePromptSubmission
  };
}