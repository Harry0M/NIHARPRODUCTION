
import React, { createContext, useContext, useEffect, useState } from 'react';

type ColorScheme = 'light' | 'dark' | 'purple' | 'blue' | 'green';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('color-scheme');
      return (stored as ColorScheme) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('color-scheme', colorScheme);
      const root = document.documentElement;
      root.classList.remove('light', 'dark', 'purple', 'blue', 'green');
      root.classList.add(colorScheme);
    }
  }, [colorScheme]);

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export const useColorScheme = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) throw new Error('useColorScheme must be used within ColorSchemeProvider');
  return context;
};
