import { StateCreator } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Actions
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
}

export const createAuthSlice: StateCreator<AuthState> = (set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,

  signInWithGitHub: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('Error signing in with GitHub:', error);
        throw error;
      }
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  },

  initializeAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  },
});