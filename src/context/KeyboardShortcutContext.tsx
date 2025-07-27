import React, { createContext, useContext, useEffect, useRef } from 'react';

interface KeyboardShortcutContextType {
  registerShortcut: (key: string, callback: () => void) => () => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | null>(null);

export const useKeyboardShortcut = () => {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error('useKeyboardShortcut must be used within a KeyboardShortcutProvider');
  }
  return context;
};

interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const shortcutsRef = useRef<Map<string, () => void>>(new Map());

  const registerShortcut = (key: string, callback: () => void) => {
    shortcutsRef.current.set(key, callback);
    
    // Return cleanup function
    return () => {
      shortcutsRef.current.delete(key);
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // Build shortcut key
      let shortcutKey = '';
      if (isCtrlOrCmd) shortcutKey += 'ctrl+';
      if (isShift) shortcutKey += 'shift+';
      if (isAlt) shortcutKey += 'alt+';
      shortcutKey += key;

      const callback = shortcutsRef.current.get(shortcutKey);
      if (callback) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <KeyboardShortcutContext.Provider value={{ registerShortcut }}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}
