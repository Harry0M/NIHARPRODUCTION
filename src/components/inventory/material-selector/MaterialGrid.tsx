import { Check } from "lucide-react";
import { Material } from "@/components/inventory/catalog/ComponentsTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Extend Material interface to include rate
interface MaterialWithRate extends Material {
  rate?: number;
}

interface MaterialGridProps {
  isLoading: boolean;
  filteredMaterials: MaterialWithRate[];
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
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-slate-500">No materials found matching your search.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${maxHeight} overflow-y-auto p-1 border rounded-md bg-slate-50`}>
      <div className="grid grid-cols-1 gap-2 p-2">
        {filteredMaterials.map((material) => (
          <Card
            key={material.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedMaterialId === material.id 
                ? 'bg-blue-50 border-blue-300' 
                : 'bg-white'
            }`}
            onClick={() => setSelectedMaterialId(material.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">{material.material_name}</h4>
                  <div className="flex flex-wrap gap-2">
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
                  {material.rate && (
                    <div className="text-sm text-emerald-600 font-medium">
                      Rate: ₹{material.rate.toFixed(2)}
                    </div>
                  )}
                </div>
                {selectedMaterialId === material.id && (
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
