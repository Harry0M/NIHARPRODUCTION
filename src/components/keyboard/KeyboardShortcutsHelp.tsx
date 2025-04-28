
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut";
import { Separator } from "@/components/ui/separator";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    {
      category: "Navigation",
      items: [
        { keys: ["g", "d"], description: "Go to Dashboard" },
        { keys: ["g", "o"], description: "Go to Orders" },
        { keys: ["g", "p"], description: "Go to Production" },
        { keys: ["g", "j"], description: "Go to Job Cards" },
        { keys: ["g", "v"], description: "Go to Vendors" },
        { keys: ["g", "s"], description: "Go to Suppliers" },
        { keys: ["g", "i"], description: "Go to Inventory" },
      ],
    },
    {
      category: "Creation",
      items: [
        { keys: ["n", "o"], description: "New Order" },
        { keys: ["n", "j"], description: "New Job Card" },
      ],
    },
    {
      category: "Actions",
      items: [
        { keys: ["/"], description: "Focus search" },
        { keys: ["?"], description: "Show this help dialog" },
        { keys: ["Esc"], description: "Close dialog/menu" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <h4 className="text-sm font-medium">{category.category}</h4>
              <Separator />
              <div className="space-y-1.5">
                {category.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{shortcut.description}</span>
                    <KeyboardShortcut keys={shortcut.keys} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
