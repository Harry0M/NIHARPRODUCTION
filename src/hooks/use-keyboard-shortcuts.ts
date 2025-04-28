
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutMapping {
  [key: string]: () => void;
}

interface ShortcutOptions {
  ignoreInputFields?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: ShortcutMapping,
  options: ShortcutOptions = { ignoreInputFields: true, preventDefault: true }
) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If we should ignore input fields and the user is typing in one, return early
      if (
        options.ignoreInputFields &&
        (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement)
      ) {
        return;
      }
      
      // Get the shortcut key combination
      let key = e.key.toLowerCase();
      
      // Add modifiers if pressed
      if (e.ctrlKey) key = `ctrl+${key}`;
      if (e.altKey) key = `alt+${key}`;
      if (e.shiftKey) key = `shift+${key}`;
      
      // Check if we have a handler for this key
      const handler = shortcuts[key];
      
      if (handler) {
        if (options.preventDefault) {
          e.preventDefault();
        }
        handler();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, options]);
  
  // Navigation helpers
  const defineNavigationShortcuts = () => {
    return {
      'g+d': () => navigate('/dashboard'),
      'g+o': () => navigate('/orders'),
      'g+p': () => navigate('/production'),
      'g+j': () => navigate('/production/job-cards'),
      'g+v': () => navigate('/vendors'),
      'g+s': () => navigate('/suppliers'),
      'g+i': () => navigate('/inventory'),
      'n+o': () => navigate('/orders/new'),
      'n+j': () => navigate('/production/job-cards/new'),
    };
  };
  
  return { defineNavigationShortcuts };
};
