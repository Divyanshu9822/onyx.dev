import React from 'react';
import { X, Github, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGitHub } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGitHub();
      // Modal will close automatically when auth state changes
    } catch (error) {
      console.error('Sign-in failed:', error);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-onyx-surface rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border border-onyx-border relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-onyx-bg-secondary rounded-lg transition-colors text-onyx-text-secondary hover:text-onyx-text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-onyx-text-primary mb-2">
            Sign in to Onyx
          </h2>
          <p className="text-onyx-text-secondary">
            Create beautiful landing pages with AI
          </p>
        </div>

        {/* GitHub Sign In Button */}
        <button
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Github className="w-5 h-5" />
          )}
          {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
        </button>

        {/* Footer */}
        <p className="text-xs text-onyx-text-disabled text-center mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}