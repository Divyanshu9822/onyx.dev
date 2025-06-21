import React, { useState, useEffect } from 'react';
import { Plus, User, LogOut, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService } from '../services/projectService';
import { ProjectSummary } from '../types';

interface SidebarProps {
  isVisible: boolean;
  onNewChat: () => void;
  onSelectProject: (projectId: string) => void;
  currentProjectId?: string;
}

export function Sidebar({ isVisible, onNewChat, onSelectProject, currentProjectId }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user projects when sidebar becomes visible
  useEffect(() => {
    if (isVisible && user) {
      loadProjects();
    }
  }, [isVisible, user]);

  const loadProjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userProjects = await ProjectService.getUserProjects();
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!user) return null;

  return (
    <div
      className={`fixed left-0 top-0 h-full w-80 bg-onyx-surface border-r border-onyx-border shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-onyx-border">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-onyx-primary text-white rounded-lg hover:bg-onyx-primary-hover transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-onyx-text-secondary mb-4 uppercase tracking-wide">
              Your Chats
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-onyx-text-secondary" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-onyx-text-disabled mx-auto mb-3" />
                <p className="text-sm text-onyx-text-secondary">No chats yet</p>
                <p className="text-xs text-onyx-text-disabled mt-1">
                  Create your first landing page to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors group ${
                      currentProjectId === project.id
                        ? 'bg-onyx-primary/10 border border-onyx-primary/20'
                        : 'hover:bg-onyx-bg-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-onyx-text-primary truncate">
                          {ProjectService.generateProjectTitle(project.prompt)}
                        </p>
                        <p className="text-xs text-onyx-text-secondary mt-1 line-clamp-2">
                          {project.prompt}
                        </p>
                      </div>
                      <span className="text-xs text-onyx-text-disabled flex-shrink-0">
                        {formatDate(project.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-6 border-t border-onyx-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full border border-onyx-border"
                />
              ) : (
                <div className="w-10 h-10 bg-onyx-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-onyx-text-secondary hover:text-onyx-text-primary hover:bg-onyx-bg-secondary rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}