import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Command } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Material {
  id: string;
  material_name: string;
  unit: string;
  color?: string;
  gsm?: string;
  purchase_rate?: number;
}

interface SearchableMaterialSelectorProps {
  materials: Material[];
  selectedMaterialId: string | null;
  onMaterialSelect: (materialId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  enableGlobalShortcut?: boolean;
  shortcutKey?: string;
}

export function SearchableMaterialSelector({
  materials,
  selectedMaterialId,
  onMaterialSelect,
  placeholder = "Select material",
  disabled = false,
  isLoading = false,
  enableGlobalShortcut = false,
  shortcutKey = "ctrl+k"
}: SearchableMaterialSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Filter materials based on search query
  const filteredMaterials = materials.filter(material => {
    const searchLower = searchQuery.toLowerCase();
    return (
      material.material_name.toLowerCase().includes(searchLower) ||
      (material.color && material.color.toLowerCase().includes(searchLower)) ||
      (material.gsm && material.gsm.toLowerCase().includes(searchLower))
    );
  });

  // Find selected material for display
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    if (!enableGlobalShortcut) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input fields or if dialog is already open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || open) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!disabled && materials.length > 0) {
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableGlobalShortcut, disabled, materials.length, open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredMaterials.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredMaterials[highlightedIndex]) {
            onMaterialSelect(filteredMaterials[highlightedIndex].id);
            setOpen(false);
            setSearchQuery("");
            setHighlightedIndex(0);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, highlightedIndex, filteredMaterials, onMaterialSelect]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && scrollAreaRef.current) {
      const highlightedElement = scrollAreaRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, open]);

  const handleSelect = (material: Material) => {
    onMaterialSelect(material.id);
    setOpen(false);
    setSearchQuery(""); // Reset search when closing
    setHighlightedIndex(0);
  };

  const getDisplayText = () => {
    if (isLoading) return "Loading materials...";
    if (materials.length === 0) return "No materials available";
    if (selectedMaterial) {
      return `${selectedMaterial.material_name}${selectedMaterial.color ? ` - ${selectedMaterial.color}` : ''}`;
    }
    return placeholder;
  };

  const getButtonVariant = (): "outline" | "default" | "destructive" | "secondary" | "ghost" | "link" => {
    if (disabled || materials.length === 0) return "outline";
    return selectedMaterial ? "outline" : "outline";
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        className="w-full justify-between text-left"
        onClick={() => !disabled && materials.length > 0 && setOpen(true)}
        disabled={disabled || isLoading || materials.length === 0}
      >
        <span className={selectedMaterial ? "text-foreground" : "text-muted-foreground"}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          {materials.length > 0 && !disabled && enableGlobalShortcut && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Material</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search materials by name, color, or GSM..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Results Count and Keyboard Hints */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              {searchQuery && (
                <span>
                  {filteredMaterials.length} of {materials.length} materials found
                </span>
              )}
              <div className="flex items-center gap-4 text-xs">
                <span>↑↓ Navigate</span>
                <span>Enter Select</span>
                <span>Esc Close</span>
              </div>
            </div>

            {/* Materials List */}
            <ScrollArea className="h-72" ref={scrollAreaRef}>
              {filteredMaterials.length > 0 ? (
                <div className="space-y-1">
                  {filteredMaterials.map((material, index) => (
                    <Button
                      key={material.id}
                      data-index={index}
                      variant="ghost"
                      className={`w-full justify-start text-left h-auto py-3 px-4 hover:bg-accent ${
                        index === highlightedIndex ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSelect(material)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="font-medium">{material.material_name}</div>
                        <div className="flex flex-wrap gap-2">
                          {material.color && (
                            <Badge variant="outline" className="text-xs">
                              {material.color}
                            </Badge>
                          )}
                          {material.gsm && (
                            <Badge variant="outline" className="text-xs">
                              {material.gsm} GSM
                            </Badge>
                          )}
                          {material.unit && (
                            <Badge variant="secondary" className="text-xs">
                              {material.unit}
                            </Badge>
                          )}
                          {material.purchase_rate && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              ₹{material.purchase_rate.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  {searchQuery ? "No materials found matching your search." : "No materials available."}
                </div>
              )}
            </ScrollArea>

            {/* Clear Selection Option */}
            {selectedMaterial && (
              <div className="border-t pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onMaterialSelect("");
                    setOpen(false);
                    setSearchQuery("");
                    setHighlightedIndex(0);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
