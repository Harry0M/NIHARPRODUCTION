
import { useState } from "react";
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
import { Package, ArrowLeft, Edit } from "lucide-react";
import { StockBasicInfo } from "@/components/inventory/StockBasicInfo";
import { StockCostTracking } from "@/components/inventory/StockCostTracking";
import { StockInventoryManagement } from "@/components/inventory/StockInventoryManagement";
import { StockSupplierInfo } from "@/components/inventory/StockSupplierInfo";
import { DeleteInventoryDialog } from "@/components/inventory/DeleteInventoryDialog";

const StockDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Stock Entry Not Found</CardTitle>
          <CardDescription>The requested inventory item could not be found.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/inventory/stock')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stock List
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
            <CardTitle>{inventory.material_type}</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/inventory/stock')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/inventory/stock/edit/${id}`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <DeleteInventoryDialog id={id!} navigateTo="/inventory/stock" />
          </div>
        </div>
        <CardDescription>
          Detailed information about this inventory item.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <StockBasicInfo inventory={inventory} />
            
            {inventory.track_cost && (
              <StockCostTracking inventory={inventory} />
            )}
          </div>
          
          <div className="space-y-4">
            <StockInventoryManagement inventory={inventory} />
            <StockSupplierInfo suppliers={inventory.suppliers} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockDetail;
