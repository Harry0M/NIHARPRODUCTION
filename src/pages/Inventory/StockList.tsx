import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { EmptyStockState } from "@/components/inventory/EmptyStockState";
import { StockDetailDialog } from "@/components/inventory/StockDetailDialog";

const StockList = () => {
  const navigate = useNavigate();
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: stock, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)');
      
      if (error) throw error;
      return data;
    },
  });

  const handleStockClick = (id: string) => {
    setSelectedStockId(id);
    setIsDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedStockId(null);
  };

  return (
    <Card>
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Inventory Stock</h2>
        <Button onClick={() => navigate('/inventory/stock/new')}>
          <Plus size={16} className="mr-2" />
          Add Stock
        </Button>
      </div>

      {isLoading ? (
        
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stock?.length === 0 ? (
        <EmptyStockState />
      ) : (
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Type</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>GSM</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                {stock?.some(item => item.alternate_unit) && (
                  <TableHead>Alt. Quantity</TableHead>
                )}
                {stock?.some(item => item.track_cost) && (
                  <>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                  </>
                )}
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleStockClick(item.id)}
                >
                  <TableCell>{item.material_type}</TableCell>
                  <TableCell>{item.color || 'N/A'}</TableCell>
                  <TableCell>{item.gsm || 'N/A'}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  {stock?.some(i => i.alternate_unit) && (
                    <TableCell>
                      {item.alternate_unit ? 
                        `${(item.quantity * (item.conversion_rate || 1)).toFixed(2)} ${item.alternate_unit}` : 
                        'N/A'}
                    </TableCell>
                  )}
                  {stock?.some(i => i.track_cost) && (
                    <>
                      <TableCell>{item.track_cost && item.purchase_price ? `₹${item.purchase_price}` : 'N/A'}</TableCell>
                      <TableCell>{item.track_cost && item.selling_price ? `₹${item.selling_price}` : 'N/A'}</TableCell>
                    </>
                  )}
                  <TableCell>{item.suppliers?.name || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <StockDetailDialog 
        stockId={selectedStockId}
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDialog}
      />
    </Card>
  );
};

export default StockList;
