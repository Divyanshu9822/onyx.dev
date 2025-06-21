import { supabase } from '../lib/supabase';
import { Project, ProjectSummary, GeneratedFiles } from '../types';

export class ProjectService {
  /**
   * Creates a new project in the database
   */
  static async createProject(prompt: string, files?: GeneratedFiles): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create a project');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        prompt,
        html: files?.html || '',
        css: files?.css || '',
        js: files?.js || ''
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to save project');
    }

    return data;
  }

  /**
   * Updates an existing project
   */
  static async updateProject(projectId: string, files: GeneratedFiles): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        html: files.html,
        css: files.css,
        js: files.js,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }

    return data;
  }

  /**
   * Gets a project by ID
   */
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching project:', error);
      throw new Error('Failed to load project');
    }

    return data;
  }

  /**
   * Gets all projects for the current user (summary view)
   */
  static async getUserProjects(): Promise<ProjectSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id, prompt, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
      throw new Error('Failed to load projects');
    }

    return data || [];
  }

  /**
   * Deletes a project
   */
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Generates a truncated title from a prompt
   */
  static generateProjectTitle(prompt: string): string {
    // Clean up the prompt and truncate to a reasonable length
    const cleaned = prompt.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 50) {
      return cleaned;
    }
    
    // Try to truncate at a word boundary
    const truncated = cleaned.substring(0, 47);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 20) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }
}