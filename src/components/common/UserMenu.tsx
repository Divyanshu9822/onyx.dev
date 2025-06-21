import React, { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store';

export function UserMenu() {
  const { user, signOut } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-onyx-bg-secondary transition-colors text-onyx-text-primary"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full border border-onyx-border"
          />
        ) : (
          <div className="w-8 h-8 bg-onyx-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-sm font-medium hidden sm:block">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-onyx-text-secondary" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-onyx-surface border border-onyx-border rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-onyx-border">
              <p className="text-sm font-medium text-onyx-text-primary">{displayName}</p>
              <p className="text-xs text-onyx-text-secondary">{user.email}</p>
            </div>
            
            <div className="p-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-onyx-text-secondary hover:text-onyx-text-primary hover:bg-onyx-bg-secondary rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}