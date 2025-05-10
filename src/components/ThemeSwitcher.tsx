import React from 'react';
import { useColorScheme, themeOptions } from '../context/ColorSchemeContext';
import { Button } from "./ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SunIcon, MoonIcon, LaptopIcon } from '@/components/icons';

export function ThemeSwitcher() {
  const { colorScheme, setColorScheme, toggleTheme, syncWithSystemTheme, isSystemTheme } = useColorScheme();

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme}
        className="rounded-full w-9 h-9"
        aria-label="Toggle theme"
      >
        {colorScheme === 'dark' ? (
          <SunIcon className="h-5 w-5 text-yellow-400 transition-all" />
        ) : (
          <MoonIcon className="h-5 w-5 text-slate-700 transition-all" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 h-9 px-3 text-xs font-medium"
          >
            {isSystemTheme ? (
              <>
                <LaptopIcon className="h-4 w-4" />
                System
              </>
            ) : (
              <>
                {themeOptions.find(opt => opt.value === colorScheme)?.icon}
                {themeOptions.find(opt => opt.value === colorScheme)?.label}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 min-w-[160px]">
          {themeOptions.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => {
                if (theme.value === 'system') {
                  syncWithSystemTheme();
                } else {
                  setColorScheme(theme.value as any);
                }
              }}
              className="flex items-center gap-2 py-1.5 cursor-pointer"
            >
              <span className="text-base">{theme.icon}</span>
              <span>{theme.label}</span>
              {(isSystemTheme && theme.value === 'system') || 
               (!isSystemTheme && theme.value === colorScheme) ? (
                <span className="ml-auto text-xs text-primary">✓</span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
