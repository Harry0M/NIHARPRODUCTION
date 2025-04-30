
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PencilLine } from "lucide-react";
import { StockBasicInfo } from "@/components/inventory/StockBasicInfo";
import { StockInventoryManagement } from "@/components/inventory/StockInventoryManagement";
import { StockSupplierInfo } from "@/components/inventory/StockSupplierInfo";
import { StockCostTracking } from "@/components/inventory/StockCostTracking";
import { Separator } from "@/components/ui/separator";
import { MaterialUsageTable } from "@/components/inventory/MaterialUsageTable";

const StockDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: material, isLoading } = useQuery({
    queryKey: ['inventory-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          supplier:supplier_id (
            id, name, contact_person, phone, email
          )
        `)
        .eq('id', id!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading inventory details...</div>;
  }

  if (!material) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Material not found</h2>
        <Button variant="outline" onClick={() => navigate("/inventory/stock")}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/inventory/stock")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {material.material_type} {material.color && `- ${material.color}`}
          </h1>
        </div>
        
        <Button 
          onClick={() => navigate(`/inventory/stock/${id}/edit`)}
          variant="outline"
        >
          <PencilLine className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main info cards */}
        <StockBasicInfo material={material} />
        <StockInventoryManagement material={material} />
        <StockSupplierInfo supplier={material.supplier} />
      </div>

      {/* Only show cost tracking if it's enabled */}
      {material.track_cost && (
        <>
          <Separator />
          <StockCostTracking material={material} />
        </>
      )}
      
      {/* Material usage history */}
      <Separator />
      <MaterialUsageTable materialId={material.id} />
    </div>
  );
};

export default StockDetail;
