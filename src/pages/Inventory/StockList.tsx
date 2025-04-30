
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const StockList = () => {
  const navigate = useNavigate();

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

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-bold">Inventory Stock</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={() => navigate('/inventory/stock/journal/list')}>
            Stock Journal
          </Button>
          <Button onClick={() => navigate('/inventory/stock/new')}>
            <Plus size={16} className="mr-2" />
            Add Raw Material
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stock?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No inventory stock found. Add raw materials to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Type</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>GSM</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Alt. Unit</TableHead>
                <TableHead>Cost Tracking</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell 
                    className="font-medium text-primary hover:underline cursor-pointer"
                    onClick={() => navigate(`/inventory/stock/${item.id}`)}
                  >
                    {item.material_type}
                  </TableCell>
                  <TableCell>{item.color || 'N/A'}</TableCell>
                  <TableCell>{item.gsm || 'N/A'}</TableCell>
                  <TableCell>
                    {item.quantity}
                    {item.reorder_level && item.quantity <= item.reorder_level && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Low
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.alternate_unit || 'N/A'}</TableCell>
                  <TableCell>
                    {item.track_cost ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Disabled
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/inventory/stock/edit/${item.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StockList;
