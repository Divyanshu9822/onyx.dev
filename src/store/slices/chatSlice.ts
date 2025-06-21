import { StateCreator } from 'zustand';
import { Message, PagePlan, GeneratedFiles } from '../../types';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentLoadingMessageId: string | null;
  
  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean, messageId?: string) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  loadProjectIntoChat: (prompt: string, files: GeneratedFiles, pagePlan?: PagePlan) => void;
}

export const createChatSlice: StateCreator<ChatState> = (set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  currentLoadingMessageId: null,

  addMessage: (message: Message) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },

  updateMessage: (messageId: string, updates: Partial<Message>) => {
    set(state => ({
      messages: state.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }));
  },

  setLoading: (loading: boolean, messageId?: string) => {
    set({
      isLoading: loading,
      currentLoadingMessageId: loading ? messageId || null : null
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearChat: () => {
    set({
      messages: [],
      isLoading: false,
      error: null,
      currentLoadingMessageId: null
    });
  },

  loadProjectIntoChat: (prompt: string, files: GeneratedFiles, pagePlan?: PagePlan) => {
    // Only show messages if there are actual files (not empty project)
    if (files.html || files.css || files.js) {
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
        pagePlan: pagePlan,
      };

      set({
        messages: [userMessage, assistantMessage],
        isLoading: false,
        error: null,
        currentLoadingMessageId: null,
      });
    } else {
      set({
        messages: [],
        isLoading: false,
        error: null,
        currentLoadingMessageId: null,
      });
    }
  },
});