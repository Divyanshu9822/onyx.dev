import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuthState, createAuthSlice } from './slices/authSlice';
import { ProjectState, createProjectSlice } from './slices/projectSlice';
import { ChatState, createChatSlice } from './slices/chatSlice';
import { UIState, createUISlice } from './slices/uiSlice';

export interface AppState extends AuthState, ProjectState, ChatState, UIState {}

export const useAppStore = create<AppState>()(
  devtools(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createProjectSlice(...args),
      ...createChatSlice(...args),
      ...createUISlice(...args),
    }),
    { name: 'onyx-store' }
  )
);