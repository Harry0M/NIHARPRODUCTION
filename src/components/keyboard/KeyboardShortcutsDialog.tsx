
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
  name: string;
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutItem[];
}

const shortcuts: ShortcutCategory[] = [
  {
    name: "Navigation",
    shortcuts: [
      { name: "Go to Dashboard", keys: ["g", "d"], description: "Navigate to the dashboard" },
      { name: "Go to Orders", keys: ["g", "o"], description: "Navigate to orders list" },
      { name: "Go to Production", keys: ["g", "p"], description: "Navigate to production dashboard" },
      { name: "Go to Job Cards", keys: ["g", "j"], description: "Navigate to job cards" },
    ],
  },
  {
    name: "Actions",
    shortcuts: [
      { name: "New Order", keys: ["n", "o"], description: "Create a new order" },
      { name: "New Job Card", keys: ["n", "j"], description: "Create a new job card" },
      { name: "Search", keys: ["/"], description: "Focus search input" },
      { name: "Save", keys: ["Ctrl", "s"], description: "Save current form" },
    ],
  },
  {
    name: "Job Cards",
    shortcuts: [
      { name: "Filter by Status", keys: ["f", "s"], description: "Focus status filter" },
      { name: "Filter by Date", keys: ["f", "d"], description: "Focus date filter" },
      { name: "View Details", keys: ["Enter"], description: "View selected job card details" },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Keyboard shortcuts to help you navigate the application faster.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.name} className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">{category.name}</h3>
              <div className="rounded-md border">
                <div className="divide-y">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{shortcut.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {shortcut.description}
                        </div>
                      </div>
                      <KeyboardShortcut keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
