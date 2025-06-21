import React, { useState, useEffect } from 'react';

interface SidebarTriggerProps {
  onToggle: (visible: boolean) => void;
  isVisible: boolean;
}

export function SidebarTrigger({ onToggle, isVisible }: SidebarTriggerProps) {
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isAtLeftEdge = e.clientX <= 10;
      const shouldShow = isAtLeftEdge || isVisible;
      
      if (isAtLeftEdge && !isHovering) {
        setIsHovering(true);
        onToggle(true);
      } else if (!isAtLeftEdge && !isVisible && isHovering) {
        setIsHovering(false);
        // Add a small delay before hiding to prevent flickering
        setTimeout(() => {
          if (!isVisible) {
            onToggle(false);
          }
        }, 300);
      }
    };

    const handleMouseLeave = () => {
      if (!isVisible) {
        setIsHovering(false);
        onToggle(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onToggle, isVisible, isHovering]);

  return (
    <div
      className={`fixed left-0 top-0 w-2 h-full z-40 ${
        isHovering ? 'bg-onyx-primary/20' : ''
      } transition-colors duration-200`}
      onMouseEnter={() => {
        setIsHovering(true);
        onToggle(true);
      }}
      onMouseLeave={() => {
        if (!isVisible) {
          setIsHovering(false);
          onToggle(false);
        }
      }}
    />
  );
}