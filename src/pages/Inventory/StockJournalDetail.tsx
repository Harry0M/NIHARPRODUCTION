
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, PencilLine } from "lucide-react";
import { StockBasicInfo } from "@/components/inventory/StockBasicInfo";
import { StockInventoryManagement } from "@/components/inventory/StockInventoryManagement";
import { StockSupplierInfo } from "@/components/inventory/StockSupplierInfo";
import { DeleteInventoryDialog } from "@/components/inventory/DeleteInventoryDialog";
import { MaterialUsageTable } from "@/components/inventory/MaterialUsageTable";
import { Separator } from "@/components/ui/separator";

const StockJournalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      if (!id) throw new Error("No inventory ID provided");
      
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          supplier:supplier_id (
            id, name, contact_person, phone, email
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error("Inventory item not found");
      
      return data;
    },
    enabled: !!id,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading inventory details...</span>
      </div>
    );
  }

  if (error || !inventory) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Stock Entry Not Found</CardTitle>
          <CardDescription>The requested inventory item could not be found.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/inventory/stock/journal/list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle>
              {inventory.material_type} {inventory.color && `- ${inventory.color}`}
            </CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/inventory/stock/edit/${id}`)}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => navigate('/inventory/stock/journal/list')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <DeleteInventoryDialog id={id as string} navigateTo="/inventory/stock/journal/list" />
          </div>
        </div>
        <CardDescription>
          Detailed information about this inventory item.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main info cards */}
          <StockBasicInfo inventory={inventory} />
          <StockInventoryManagement inventory={inventory} />
          <StockSupplierInfo supplier={inventory.supplier} />
        </div>
        
        {/* Material usage history */}
        <Separator />
        <MaterialUsageTable materialId={inventory.id} />
      </CardContent>
    </Card>
  );
};

export default StockJournalDetail;
