
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";

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
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-bold">Inventory Stock</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={() => navigate('/inventory/stock/journal')}>
            Stock Journal
          </Button>
          <Button onClick={() => navigate('/inventory/stock/new')}>
            <Plus size={16} className="mr-2" />
            Add Stock
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
            <p className="text-muted-foreground">No inventory stock found.</p>
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
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/inventory/stock/${item.id}`)}
                >
                  <TableCell>{item.material_type}</TableCell>
                  <TableCell>{item.color || 'N/A'}</TableCell>
                  <TableCell>{item.gsm || 'N/A'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.alternate_unit || 'N/A'}</TableCell>
                  <TableCell>{item.suppliers?.name || 'N/A'}</TableCell>
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
