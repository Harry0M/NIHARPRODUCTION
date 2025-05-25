
import { useState } from "react";
import { useInventoryItems } from "@/hooks/use-catalog-products";
import { MaterialSearchBar } from "./MaterialSearchBar";
import { MaterialGrid } from "./MaterialGrid";
import { Button } from "@/components/ui/button";

interface MaterialSelectorProps {
  onMaterialSelect: (materialId: string | null) => void;
  selectedMaterialId: string | null;
  componentType: string;
}

export const MaterialSelector = ({ 
  onMaterialSelect, 
  selectedMaterialId,
  componentType
}: MaterialSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  
  const { data: materials = [], isLoading } = useInventoryItems();
  
  const filteredMaterials = materials.filter(material => {
    const searchLower = searchQuery.toLowerCase();
    return (
      material.material_name.toLowerCase().includes(searchLower) || 
      (material.color && material.color.toLowerCase().includes(searchLower)) ||
      (material.gsm && material.gsm?.toString().toLowerCase().includes(searchLower))
    );
  });

  const toggleMaterialSelector = () => {
    setShowMaterialSelector(!showMaterialSelector);
  };
  
  const clearMaterial = () => {
    onMaterialSelect(null);
  };
  
  const handleConfirmSelection = () => {
    setShowMaterialSelector(false);
  };
  
  // Find the selected material to display its name
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  return (
    <div className="space-y-3 mt-2">
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button" 
          variant={showMaterialSelector ? "default" : "outline"} 
          size="sm" 
          onClick={toggleMaterialSelector}
        >
          {showMaterialSelector ? "Hide Material Selector" : "Link Material"}
        </Button>
        
        {selectedMaterialId && (
          <>
            <Button 
              type="button" 
              variant="destructive" 
              size="sm"
              onClick={clearMaterial}
            >
              Clear Selection
            </Button>
            
            <div className="ml-2 flex items-center">
              <span className="text-sm font-medium">Selected: </span>
              <span className="ml-1 text-sm text-blue-600">
                {selectedMaterial?.material_name || 'Unknown material'}
              </span>
            </div>
          </>
        )}
      </div>
      
      {showMaterialSelector && (
        <div className="border rounded-md p-4 bg-slate-50">
          <h4 className="text-sm font-medium mb-3">Select Material for {componentType}</h4>
          
          <MaterialSearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            placeholder="Search for a material..." 
          />
          
          <MaterialGrid 
            isLoading={isLoading}
            filteredMaterials={filteredMaterials}
            selectedMaterialId={selectedMaterialId}
            setSelectedMaterialId={onMaterialSelect}
            maxHeight="max-h-48"
          />
          
          <div className="flex justify-end mt-3">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmSelection}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
