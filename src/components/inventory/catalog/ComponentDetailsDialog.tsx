
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { LinkIcon } from "lucide-react";
import { MaterialLinkSelector } from "@/components/inventory/MaterialLinkSelector";
import { CatalogComponent } from "./ComponentsTable";

interface Material {
  id: string;
  material_type: string;
  color?: string | null;
  gsm?: string | null;
  quantity?: number;
  unit?: string;
}

interface ComponentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedComponent: CatalogComponent | null;
  filteredMaterials: Material[];
  isLoadingInventory: boolean;
  onMaterialLinkSuccess: () => void;
  componentTypes: Record<string, string>;
}

export const ComponentDetailsDialog = ({
  open,
  onOpenChange,
  selectedComponent,
  filteredMaterials,
  isLoadingInventory,
  onMaterialLinkSuccess,
  componentTypes,
}: ComponentDetailsDialogProps) => {
  const [isLinkingMaterial, setIsLinkingMaterial] = useState(false);

  const handleLinkMaterial = () => {
    setIsLinkingMaterial(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedComponent?.component_type === 'custom'
              ? `Custom Component: ${selectedComponent.custom_name}`
              : `${componentTypes[selectedComponent?.component_type as keyof typeof componentTypes]} Details`}
          </DialogTitle>
        </DialogHeader>
        {selectedComponent && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Size</p>
              <p className="font-medium">{selectedComponent.size || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Color</p>
              <p className="font-medium">{selectedComponent.color || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">GSM</p>
              <p className="font-medium">{selectedComponent.gsm || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Roll Width</p>
              <p className="font-medium">{selectedComponent.roll_width || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Length</p>
              <p className="font-medium">{selectedComponent.length || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Width</p>
              <p className="font-medium">{selectedComponent.width || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Consumption</p>
              <p className="font-medium">{selectedComponent.consumption || 'N/A'}</p>
            </div>
            
            {/* Material Information Section */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Material Information</h3>
                {!isLinkingMaterial && !isLoadingInventory && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleLinkMaterial} 
                    className="flex items-center gap-1"
                  >
                    <LinkIcon size={14} /> Link Material
                  </Button>
                )}
              </div>
              
              {isLinkingMaterial ? (
                <MaterialLinkSelector 
                  componentId={selectedComponent.id}
                  materials={filteredMaterials}
                  onSuccess={onMaterialLinkSuccess}
                  onCancel={() => setIsLinkingMaterial(false)}
                  isLoading={isLoadingInventory}
                />
              ) : (
                <>
                  {selectedComponent.material ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Material Type</p>
                        <p className="font-medium">{selectedComponent.material.material_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Color</p>
                        <p className="font-medium">{selectedComponent.material.color || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">GSM</p>
                        <p className="font-medium">{selectedComponent.material.gsm || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Inventory Quantity</p>
                        <p className="font-medium">
                          {selectedComponent.material.quantity} {selectedComponent.material.unit}
                        </p>
                      </div>
                    </div>
                  ) : selectedComponent.material_id ? (
                    <div className="p-3 bg-yellow-50 rounded-md text-amber-800">
                      Material ID exists ({selectedComponent.material_id.substring(0, 8)}...) but no details found. 
                      The material may have been deleted or is no longer available.
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                      No material linked to this component. Click "Link Material" to associate a material from inventory.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
