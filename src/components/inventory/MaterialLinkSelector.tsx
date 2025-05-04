
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Plus, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Material } from "@/components/inventory/catalog/ComponentsTable";

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

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-md">
            <p className="text-slate-500">No materials found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2">
            {filteredMaterials.map((material) => (
              <Card
                key={material.id}
                className={`cursor-pointer transition-all p-3 hover:shadow-md ${
                  selectedMaterialId === material.id 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border border-slate-200 bg-white'
                }`}
                onClick={() => setSelectedMaterialId(material.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-slate-900">{material.material_name}</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {material.color && (
                        <Badge variant="outline" className="bg-white">
                          {material.color}
                        </Badge>
                      )}
                      {material.gsm && (
                        <Badge variant="outline" className="bg-white">
                          {material.gsm} GSM
                        </Badge>
                      )}
                      {material.quantity && (
                        <Badge variant="outline" className="bg-white">
                          {material.quantity} {material.unit || ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedMaterialId === material.id && (
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
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
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
