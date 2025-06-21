import React, { useState, useEffect, useRef } from 'react';

interface SidebarTriggerProps {
  onToggle: (visible: boolean) => void;
  isVisible: boolean;
}

export function SidebarTrigger({ onToggle, isVisible }: SidebarTriggerProps) {
  const [isHovering, setIsHovering] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isAtLeftEdge = e.clientX <= 10;
      const isOverSidebar = e.clientX <= 320; // Sidebar width is 320px (w-80)
      
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      
      if (isAtLeftEdge && !isVisible) {
        setIsHovering(true);
        onToggle(true);
      } else if (!isOverSidebar && isVisible && !isAtLeftEdge) {
        // Mouse is not over sidebar area and not at left edge
        setIsHovering(false);
        // Add a small delay before hiding to prevent flickering
        hideTimeoutRef.current = setTimeout(() => {
          onToggle(false);
          hideTimeoutRef.current = null;
        }, 300);
      }
    };

    const handleMouseLeave = () => {
      // When mouse leaves the document, hide the sidebar
      setIsHovering(false);
      if (isVisible) {
        onToggle(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [onToggle, isVisible]);

  return (
    <div
      className={`fixed left-0 top-0 w-2 h-full z-40 ${
        isHovering ? 'bg-onyx-primary/20' : ''
      } transition-colors duration-200`}
      onMouseEnter={() => {
        setIsHovering(true);
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        onToggle(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        // Don't immediately hide, let the mousemove handler deal with it
      }}
    />
  );
}