import { StateCreator } from 'zustand';
import { Project, ProjectSummary, GeneratedFiles, PagePlan } from '../../types';
import { ProjectService } from '../../services/projectService';

export interface ProjectState {
  currentProject: Project | null;
  userProjects: ProjectSummary[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createProject: (prompt: string, files?: GeneratedFiles) => Promise<Project>;
  loadProject: (projectId: string) => Promise<Project>;
  updateProject: (files: GeneratedFiles, plan?: PagePlan) => Promise<Project>;
  loadUserProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearProject: () => void;
  setCurrentProject: (project: Project | null) => void;
}

export const createProjectSlice: StateCreator<ProjectState> = (set, get) => ({
  currentProject: null,
  userProjects: [],
  isLoading: false,
  error: null,

  createProject: async (prompt: string, files?: GeneratedFiles) => {
    set({ isLoading: true, error: null });
    
    try {
      const project = await ProjectService.createProject(prompt, files);
      set({ currentProject: project, isLoading: false });
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const project = await ProjectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      set({ currentProject: project, isLoading: false });
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  updateProject: async (files: GeneratedFiles, plan?: PagePlan) => {
    const { currentProject } = get();
    if (!currentProject) {
      throw new Error('No current project to update');
    }

    set({ isLoading: true, error: null });
    
    try {
      const updatedProject = await ProjectService.updateProject(currentProject.id, files, plan);
      set({ currentProject: updatedProject, isLoading: false });
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  loadUserProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const projects = await ProjectService.getUserProjects();
      set({ userProjects: projects, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await ProjectService.deleteProject(projectId);
      set(state => ({
        userProjects: state.userProjects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      set({ error: errorMessage });
      throw err;
    }
  },

  clearProject: () => {
    set({ currentProject: null, error: null });
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },
});