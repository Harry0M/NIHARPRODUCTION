
import * as React from "react";
import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useColorScheme } from "@/context/ColorSchemeContext";

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setColorScheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorScheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorScheme('purple')}>
          <Palette className="mr-2 h-4 w-4" />
          Purple
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorScheme('blue')}>
          <Palette className="mr-2 h-4 w-4" />
          Blue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorScheme('green')}>
          <Palette className="mr-2 h-4 w-4" />
          Green
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
