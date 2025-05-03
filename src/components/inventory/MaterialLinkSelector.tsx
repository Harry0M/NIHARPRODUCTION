
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

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
  onSuccess: () => void;
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
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleUpdateMaterial = async () => {
    if (!selectedMaterialId || !componentId) return;
    
    setIsUpdating(true);
    setDebugInfo(null);
    
    try {
      console.log("Updating material with ID:", selectedMaterialId, "for component:", componentId);
      
      // First, get the component details including catalog_id
      const { data: componentData, error: componentError } = await supabase
        .from("catalog_components")
        .select("id, catalog_id, material_id")
        .eq("id", componentId)
        .single();
        
      if (componentError) {
        console.error("Error fetching component:", componentError);
        setDebugInfo({ error: "component_fetch_error", details: componentError });
        throw new Error(`Cannot access component: ${componentError.message}`);
      }
      
      console.log("Component data fetched:", componentData);
      
      // Get the catalog details to check who created it
      const { data: catalogData, error: catalogError } = await supabase
        .from("catalog")
        .select("id, created_by, name")
        .eq("id", componentData.catalog_id)
        .single();
      
      if (catalogError) {
        console.error("Error fetching catalog:", catalogError);
        setDebugInfo({ error: "catalog_fetch_error", details: catalogError });
        throw new Error(`Cannot access catalog: ${catalogError.message}`);
      }
      
      console.log("Catalog data fetched:", catalogData);
      
      if (!catalogData.created_by) {
        // Update the catalog to set the created_by field to the current user
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id;
        
        if (currentUserId) {
          console.log("Setting catalog created_by to current user:", currentUserId);
          
          const { data: updateCatalogData, error: updateCatalogError } = await supabase
            .from("catalog")
            .update({ created_by: currentUserId })
            .eq("id", catalogData.id)
            .select();
          
          if (updateCatalogError) {
            console.error("Error updating catalog created_by:", updateCatalogError);
            setDebugInfo({ error: "catalog_update_error", details: updateCatalogError });
            // Continue anyway, we'll try the component update
          } else {
            console.log("Catalog created_by updated successfully:", updateCatalogData);
          }
        }
      }
      
      // Perform the component update
      const { data: updateData, error: updateError } = await supabase
        .from("catalog_components")
        .update({ 
          material_id: selectedMaterialId,
          updated_at: new Date().toISOString()
        })
        .eq("id", componentId)
        .select();
      
      if (updateError) {
        console.error("Error updating material:", updateError);
        setDebugInfo({ error: "component_update_error", details: updateError });
        throw new Error(`Update failed: ${updateError.message}`);
      }
      
      console.log("Component update response:", updateData);
      
      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from("catalog_components")
        .select("material_id")
        .eq("id", componentId)
        .single();
      
      if (verifyError) {
        console.error("Error verifying update:", verifyError);
        setDebugInfo({ error: "verification_error", details: verifyError });
        throw new Error("Could not verify the update was successful");
      }
      
      if (verifyData.material_id !== selectedMaterialId) {
        console.error("Update verification failed: Material ID doesn't match what was set");
        setDebugInfo({ error: "verification_mismatch", expected: selectedMaterialId, actual: verifyData.material_id });
        throw new Error("Material was not properly linked. Please try again.");
      }
      
      console.log("Update verified successful:", verifyData);
      
      // Update succeeded and was verified
      setTimeout(() => {
        onSuccess();
        showToast({
          title: "Material linked successfully",
          description: "The component has been updated with the selected material",
          type: "success"
        });
      }, 500); // Small delay to ensure database consistency
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
      
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setDebugMode(!debugMode)}
          type="button"
        >
          {debugMode ? "Hide Debug" : "Debug Info"}
        </Button>
        
        <div className="flex gap-2">
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
      
      {debugMode && debugInfo && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div className="font-medium text-amber-800">Debug Information</div>
          </div>
          <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
