
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Plus, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Material } from "@/components/inventory/catalog/ComponentsTable";
import { MaterialSearchBar } from "./material-selector/MaterialSearchBar";
import { MaterialGrid } from "./material-selector/MaterialGrid";
import { DebugPanel } from "./material-selector/DebugPanel";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaterials = materials.filter(material => {
    const searchLower = searchQuery.toLowerCase();
    return (
      material.material_name.toLowerCase().includes(searchLower) || 
      (material.color && material.color.toLowerCase().includes(searchLower)) ||
      (material.gsm && material.gsm.toLowerCase().includes(searchLower))
    );
  });

  const handleUpdateMaterial = async () => {
    if (!selectedMaterialId || !componentId) {
      showToast({
        title: "Selection required",
        description: "Please select a material to link",
        type: "warning"
      });
      return;
    }
    
    setIsUpdating(true);
    setDebugInfo(null);
    
    try {
      console.log("Linking material ID:", selectedMaterialId, "to component:", componentId);
      
      // First, verify the component exists
      const { data: componentCheck, error: componentCheckError } = await supabase
        .from("catalog_components")
        .select("id")
        .eq("id", componentId)
        .single();
        
      if (componentCheckError) {
        throw new Error(`Component verification failed: ${componentCheckError.message}`);
      }

      // Use the updated RPC function to update the material link
      const { data: updateResult, error: rpcError } = await supabase
        .rpc('update_component_material', {
          component_id: componentId,
          material_id: selectedMaterialId
        });
      
      if (rpcError) {
        console.error("Error using update_component_material RPC:", rpcError);
        setDebugInfo({ error: "rpc_error", details: rpcError });
        throw new Error(`Material link update failed: ${rpcError.message}`);
      }
      
      // Check the result of the RPC call (should be true if successful)
      if (updateResult !== true) {
        console.error("Material link update unsuccessful, result:", updateResult);
        setDebugInfo({ 
          error: "update_failed", 
          details: "RPC call returned false or unexpected value", 
          result: updateResult 
        });
        
        // Double-check the update manually
        const { data: verifyData, error: verifyError } = await supabase
          .from("catalog_components")
          .select("material_id, material_linked")
          .eq("id", componentId)
          .single();
          
        if (verifyError || !verifyData) {
          throw new Error("Material linking failed - verification check failed");
        }
        
        if (verifyData.material_id !== selectedMaterialId || !verifyData.material_linked) {
          throw new Error("Material was not properly linked after retry");
        }
        
        // If we got here, the update actually worked despite the RPC returning false
        console.log("Manual verification succeeded despite RPC returning false");
      }
      
      console.log("Material linking verified successful");
      
      // Success - notify the parent component
      showToast({
        title: "Material linked successfully",
        description: "The component has been updated with the selected material",
        type: "success"
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error linking material:", error);
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
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-100 shadow-sm">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Link Material</h3>
        <p className="text-sm text-slate-600 mb-4">
          Select a material to link to this component. This will update the component with material properties.
        </p>

        <MaterialSearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        
        <MaterialGrid 
          isLoading={isLoading}
          filteredMaterials={filteredMaterials}
          selectedMaterialId={selectedMaterialId}
          setSelectedMaterialId={setSelectedMaterialId}
        />
      </div>

      <ActionButtons 
        debugMode={debugMode}
        setDebugMode={setDebugMode}
        onCancel={onCancel}
        handleUpdateMaterial={handleUpdateMaterial}
        isUpdating={isUpdating}
        selectedMaterialId={selectedMaterialId}
      />
      
      <DebugPanel 
        debugMode={debugMode} 
        debugInfo={debugInfo} 
      />
    </div>
  );
};

// Action buttons component
const ActionButtons = ({ 
  debugMode, 
  setDebugMode, 
  onCancel, 
  handleUpdateMaterial,
  isUpdating,
  selectedMaterialId
}: {
  debugMode: boolean;
  setDebugMode: (mode: boolean) => void;
  onCancel: () => void;
  handleUpdateMaterial: () => Promise<void>;
  isUpdating: boolean;
  selectedMaterialId: string | null;
}) => (
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
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {isUpdating ? 'Saving...' : 'Save'}
      </Button>
    </div>
  </div>
);
