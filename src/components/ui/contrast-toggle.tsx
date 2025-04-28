
import { Moon, Sun } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function ContrastToggle() {
  const [highContrast, setHighContrast] = useLocalStorage<boolean>(
    "high-contrast-theme",
    false
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setHighContrast(!highContrast)}
      className="px-2"
      aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
      title={highContrast ? "Disable high contrast" : "Enable high contrast"}
    >
      {highContrast ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="ml-2">{highContrast ? "Standard Contrast" : "High Contrast"}</span>
    </Button>
  );
}
