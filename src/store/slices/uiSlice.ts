import { StateCreator } from 'zustand';

export interface UIState {
  sidebarVisible: boolean;
  showAuthModal: boolean;
  workspaceViewMode: 'preview' | 'code';
  
  // Actions
  setSidebarVisible: (visible: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  setWorkspaceViewMode: (mode: 'preview' | 'code') => void;
}

export const createUISlice: StateCreator<UIState> = (set) => ({
  sidebarVisible: false,
  showAuthModal: false,
  workspaceViewMode: 'preview',

  setSidebarVisible: (visible: boolean) => {
    set({ sidebarVisible: visible });
  },

  setShowAuthModal: (show: boolean) => {
    set({ showAuthModal: show });
  },

  setWorkspaceViewMode: (mode: 'preview' | 'code') => {
    set({ workspaceViewMode: mode });
  },
});