
import React, { createContext, useContext, useEffect, useState } from 'react';

// Enhanced theme options with more precise type names
type ColorScheme = 'light' | 'dark' | 'purple' | 'blue' | 'green';

// Expanded context to include more theme functionality
interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  syncWithSystemTheme: () => void;
}

// Theme options for UI display
export const themeOptions = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'purple', label: 'Purple', icon: '🟣' },
  { value: 'blue', label: 'Blue', icon: '🔵' },
  { value: 'green', label: 'Green', icon: '🟢' },
  { value: 'system', label: 'System', icon: '🖥️' },
];

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with stored theme or system preference
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const storedScheme = localStorage.getItem('color-scheme');
    if (storedScheme === 'system' || !storedScheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return (storedScheme as ColorScheme) || 'light';
  });
  
  const [isSystemTheme, setIsSystemTheme] = useState<boolean>(() => {
    return localStorage.getItem('color-scheme') === 'system';
  });

  // Determine if current theme is dark
  const isDarkMode = colorScheme === 'dark' || 
                  (isSystemTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Set theme with proper storage handling
  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    setIsSystemTheme(false);
    localStorage.setItem('color-scheme', scheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setIsSystemTheme(false);
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  // Use system theme preference
  const syncWithSystemTheme = () => {
    setIsSystemTheme(true);
    localStorage.setItem('color-scheme', 'system');
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setColorSchemeState(systemIsDark ? 'dark' : 'light');
  };

  // Apply theme class and update on system preference change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'purple', 'blue', 'green');
    root.classList.add(colorScheme);

    // Listen for system theme changes if using system theme
    if (isSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setColorSchemeState(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [colorScheme, isSystemTheme]);

  return (
    <ColorSchemeContext.Provider 
      value={{ 
        colorScheme, 
        setColorScheme, 
        isDarkMode, 
        toggleTheme,
        isSystemTheme,
        syncWithSystemTheme
      }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
}

export const useColorScheme = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) throw new Error('useColorScheme must be used within ColorSchemeProvider');
  return context;
};
