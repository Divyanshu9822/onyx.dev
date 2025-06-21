import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectService } from '../services/projectService';
import { Project, GeneratedFiles } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useProject() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const createNewProject = useCallback(async (prompt: string, files?: GeneratedFiles) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to create a project');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const project = await ProjectService.createProject(prompt, files);
      setCurrentProject(project);
      navigate(`/project/${project.id}`);
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, navigate]);

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const project = await ProjectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      setCurrentProject(project);
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (files: GeneratedFiles) => {
    if (!currentProject) {
      throw new Error('No current project to update');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = await ProjectService.updateProject(currentProject.id, files);
      setCurrentProject(updatedProject);
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const clearProject = useCallback(() => {
    setCurrentProject(null);
    setError(null);
  }, []);

  const startNewChat = useCallback(() => {
    clearProject();
    navigate('/');
  }, [clearProject, navigate]);

  return {
    currentProject,
    isLoading,
    error,
    createNewProject,
    loadProject,
    updateProject,
    clearProject,
    startNewChat
  };
}