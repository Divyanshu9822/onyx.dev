import React from 'react';
import { useAppStore } from '../../store';
import { UserMenu } from './UserMenu';
import { LogIn } from 'lucide-react';
import icon from '../../assets/icon.jpg';

interface HeaderProps {
  showAuth?: boolean;
  onSignInClick?: () => void;
  onLogoClick?: () => void;
  showBorder?: boolean;
}

export function Header({ showAuth = true, onSignInClick, onLogoClick, showBorder = false }: HeaderProps) {
  const { isAuthenticated } = useAppStore();

  return (
    <header className={`px-6 py-4 flex items-center justify-between relative z-30 ${showBorder ? 'border-b border-onyx-border bg-onyx-surface' : ''}`}>
      <button onClick={onLogoClick}>
        <img 
          src={icon} 
          alt="App Icon" 
          className="w-12 h-12 rounded-md hover:opacity-80 transition-opacity" 
          draggable="false" 
        />
      </button>
      
      {showAuth && (
        <div className="flex items-center">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-2 px-4 py-2 bg-onyx-primary text-white rounded-lg hover:bg-onyx-primary-hover transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>
      )}
    </header>
  );
}