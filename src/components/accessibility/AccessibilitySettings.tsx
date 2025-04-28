
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ContrastToggle } from "@/components/ui/contrast-toggle";
import { Settings } from "lucide-react";

export function AccessibilitySettings() {
  const [open, setOpen] = useState(false);
  const [textSize, setTextSize] = useLocalStorage("a11y-text-size", 100);
  const [reducedMotion, setReducedMotion] = useLocalStorage("a11y-reduced-motion", false);
  const [focusIndicators, setFocusIndicators] = useLocalStorage("a11y-focus-indicators", true);

  // Update CSS variables based on accessibility settings
  const updateTextSize = (value: number) => {
    setTextSize(value);
    document.documentElement.style.setProperty("--text-size-adjustment", `${value}%`);
  };

  const updateReducedMotion = (checked: boolean) => {
    setReducedMotion(checked);
    document.documentElement.classList.toggle("reduce-motion", checked);
  };

  const updateFocusIndicators = (checked: boolean) => {
    setFocusIndicators(checked);
    document.documentElement.classList.toggle("enhanced-focus", checked);
  };

  // Apply settings when component mounts
  useState(() => {
    document.documentElement.style.setProperty("--text-size-adjustment", `${textSize}%`);
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    document.documentElement.classList.toggle("enhanced-focus", focusIndicators);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          aria-label="Accessibility settings"
        >
          <Settings className="h-4 w-4" />
          <span>Accessibility</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
          <DialogDescription>
            Customize your experience to make the application more accessible.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="text-size">Text Size ({textSize}%)</Label>
            <Slider
              id="text-size"
              min={75}
              max={150}
              step={5}
              value={[textSize]}
              onValueChange={([value]) => updateTextSize(value)}
              aria-label="Adjust text size"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={(checked) => 
                updateReducedMotion(checked === true)
              }
            />
            <Label htmlFor="reduced-motion" className="cursor-pointer">
              Reduce motion/animations
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="focus-indicators"
              checked={focusIndicators}
              onCheckedChange={(checked) => 
                updateFocusIndicators(checked === true)
              }
            />
            <Label htmlFor="focus-indicators" className="cursor-pointer">
              Enhanced focus indicators
            </Label>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label>Contrast Mode</Label>
            <ContrastToggle />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
