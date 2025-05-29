import { useState, useEffect } from "react";
import { 
  NoAnimationDialog as Dialog, 
  NoAnimationDialogContent as DialogContent, 
  NoAnimationDialogHeader as DialogHeader, 
  NoAnimationDialogTitle as DialogTitle 
} from "@/components/purchases/NoAnimationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Item {
  id: string;
  name: string;
  [key: string]: any;
}

interface SearchSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: Item[];
  onSelect: (item: Item) => void;
  displayField: string;
  secondaryField?: string;
  searchFields?: string[];
}

export function SearchSelectDialog({
  open,
  onOpenChange,
  title,
  items,
  onSelect,
  displayField,
  secondaryField,
  searchFields = ["name"]
}: SearchSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);

  // Update filtered items when items change or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const filtered = items.filter(item => {
      return searchFields.some(field => {
        if (!item[field]) return false;
        return item[field].toString().toLowerCase().includes(lowerQuery);
      });
    });

    setFilteredItems(filtered);
  }, [items, searchQuery, searchFields]);

  // Clear search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleSelect = (item: Item) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleSelect(item)}
                >
                  <div>
                    <div className="font-medium">{item[displayField]}</div>
                    {secondaryField && item[secondaryField] && (
                      <div className="text-sm text-muted-foreground">{item[secondaryField]}</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No items found
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
