
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Material } from "@/components/inventory/catalog/ComponentsTable";

interface MaterialGridProps {
  isLoading: boolean;
  filteredMaterials: Material[];
  selectedMaterialId: string | null;
  setSelectedMaterialId: (id: string) => void;
  maxHeight?: string;
}

export const MaterialGrid = ({
  isLoading,
  filteredMaterials,
  selectedMaterialId,
  setSelectedMaterialId,
  maxHeight = "max-h-64"
}: MaterialGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (filteredMaterials.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-md">
        <p className="text-slate-500">No materials found matching your search.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-2 ${maxHeight} overflow-y-auto p-2`}>
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
          <div className="flex justify-between items-center">
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
  );
};
