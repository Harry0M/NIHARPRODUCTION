import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  material_name: string;
  unit: string;
  color?: string;
  gsm?: string;
  purchase_rate?: number;
}

interface MaterialSelectionPopupProps {
  materials: Material[];
  selectedMaterialId?: string;
  onSelectMaterial: (materialId: string) => void;
  disabled?: boolean;
  materialsLoading?: boolean;
  placeholder?: string;
}

export function MaterialSelectionPopup({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  disabled = false,
  materialsLoading = false,
  placeholder = "Select material..."
}: MaterialSelectionPopupProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Find the selected material
  const selectedMaterial = materials.find(material => material.id === selectedMaterialId);

  // Filter materials based on search query
  const filteredMaterials = materials.filter(material => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      material.material_name.toLowerCase().includes(query) ||
      material.color?.toLowerCase().includes(query) ||
      material.gsm?.toLowerCase().includes(query) ||
      material.unit.toLowerCase().includes(query)
    );
  });

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleSelect = (materialId: string) => {
    onSelectMaterial(materialId);
    setOpen(false);
  };

  const getDisplayText = () => {
    if (materialsLoading) return "Loading materials...";
    if (materials.length === 0) return "No materials available";
    if (selectedMaterial) {
      return `${selectedMaterial.material_name}${selectedMaterial.color ? ` - ${selectedMaterial.color}` : ''}`;
    }
    return placeholder;
  };

  const getButtonVariant = () => {
    if (disabled || materialsLoading || materials.length === 0) return "secondary";
    return "outline";
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled || materialsLoading || materials.length === 0}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2 truncate">
          <Package className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search materials..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No materials found.</p>
                {searchQuery.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Try searching with different keywords
                  </p>
                )}
              </div>
            </CommandEmpty>
            
            <CommandGroup heading={`Materials (${filteredMaterials.length})`}>
              {filteredMaterials.map((material) => (
                <CommandItem
                  key={material.id}
                  value={material.id}
                  onSelect={() => handleSelect(material.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedMaterialId === material.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">
                        {material.material_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {material.color && (
                        <span className="px-2 py-1 bg-muted rounded">
                          {material.color}
                        </span>
                      )}
                      {material.gsm && (
                        <span>GSM: {material.gsm}</span>
                      )}
                      <span>Unit: {material.unit}</span>
                      {material.purchase_rate && (
                        <span>₹{material.purchase_rate}/unit</span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  );
}
