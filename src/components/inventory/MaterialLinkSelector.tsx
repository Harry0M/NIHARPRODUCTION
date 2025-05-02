
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";

interface Material {
  id: string;
  material_type: string;
  color?: string | null;
  gsm?: string | null;
  quantity?: number;
  unit?: string;
}

interface MaterialLinkSelectorProps {
  componentId: string;
  materials: Material[];
  onSuccess: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const MaterialLinkSelector = ({
  componentId,
  materials,
  onSuccess,
  onCancel,
  isLoading
}: MaterialLinkSelectorProps) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateMaterial = async () => {
    if (!selectedMaterialId || !componentId) return;
    
    setIsUpdating(true);
    try {
      console.log("Updating material with ID:", selectedMaterialId, "for component:", componentId);
      
      const { data, error } = await supabase
        .from("catalog_components")
        .update({ material_id: selectedMaterialId })
        .eq("id", componentId)
        .select();
        
      if (error) {
        console.error("Error updating material:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      await onSuccess();
      showToast({
        title: "Material linked successfully",
        description: "The component has been updated with the selected material",
        type: "success"
      });
    } catch (error: any) {
      console.error("Error updating material:", error);
      showToast({
        title: "Failed to link material",
        description: `Error: ${error.message || "Unknown error occurred"}`,
        type: "error"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-md bg-muted/20">
      <div className="space-y-2">
        <label htmlFor="material-select" className="text-sm font-medium">
          Select Material
        </label>
        <Select onValueChange={setSelectedMaterialId} value={selectedMaterialId || undefined}>
          <SelectTrigger id="material-select" className="w-full">
            <SelectValue placeholder="Select a material" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>Loading materials...</SelectItem>
            ) : materials.length === 0 ? (
              <SelectItem value="none" disabled>No matching materials found</SelectItem>
            ) : (
              materials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.material_type} 
                  {material.color ? ` - ${material.color}` : ''} 
                  {material.gsm ? ` ${material.gsm}` : ''}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          size="sm"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpdateMaterial} 
          disabled={!selectedMaterialId || isUpdating}
          size="sm"
        >
          {isUpdating ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
