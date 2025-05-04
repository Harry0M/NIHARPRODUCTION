
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { AlertCircle, LinkIcon, LoaderCircle } from "lucide-react";
import { MaterialLinkSelector } from "@/components/inventory/MaterialLinkSelector";
import { CatalogComponent, Material } from "./ComponentsTable";

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

  // Debug logged information about the component and its material
  console.log("ComponentDetailsDialog - Selected Component:", selectedComponent);
  if (selectedComponent) {
    console.log("  - material_id:", selectedComponent.material_id);
    console.log("  - material_linked:", selectedComponent.material_linked);
    console.log("  - material object:", selectedComponent.material);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedComponent?.component_type === 'custom'
              ? `Custom Component: ${selectedComponent.custom_name}`
              : `${componentTypes[selectedComponent?.component_type as keyof typeof componentTypes] || 'Component'} Details`}
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
                    <LinkIcon size={14} /> {selectedComponent.material ? 'Change Material' : 'Link Material'}
                  </Button>
                )}
              </div>
              
              {isLinkingMaterial ? (
                <MaterialLinkSelector 
                  componentId={selectedComponent.id}
                  materials={filteredMaterials}
                  onSuccess={() => {
                    setIsLinkingMaterial(false);
                    onMaterialLinkSuccess();
                  }}
                  onCancel={() => setIsLinkingMaterial(false)}
                  isLoading={isLoadingInventory}
                />
              ) : isLoadingInventory ? (
                <div className="p-3 bg-muted rounded-md flex items-center justify-center gap-2">
                  <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading material information...</span>
                </div>
              ) : (
                <>
                  {selectedComponent.material ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Material Type</p>
                        <p className="font-medium">{selectedComponent.material.material_name}</p>
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
                  ) : selectedComponent.material_id && selectedComponent.material_linked ? (
                    <div className="p-3 bg-yellow-50 rounded-md text-amber-800 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Material reference found but details missing</p>
                        <p className="text-sm">
                          Material ID exists ({selectedComponent.material_id.substring(0, 8)}...) but the material details couldn't be loaded. 
                          This may happen if the material has been deleted or if there's a permission issue.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2" 
                          onClick={handleLinkMaterial}
                        >
                          Link Different Material
                        </Button>
                      </div>
                    </div>
                  ) : selectedComponent.material_id ? (
                    <div className="p-3 bg-blue-50 rounded-md text-blue-800 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Material ID found but not properly linked</p>
                        <p className="text-sm">
                          This component has a reference to a material ({selectedComponent.material_id.substring(0, 8)}...) 
                          but the linking process was not completed. Click "Link Material" to associate it properly.
                        </p>
                      </div>
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
