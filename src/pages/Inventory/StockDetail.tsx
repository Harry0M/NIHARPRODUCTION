
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import StockBasicInfo from "@/components/inventory/StockBasicInfo";
import StockInventoryManagement from "@/components/inventory/StockInventoryManagement";
import StockCostTracking from "@/components/inventory/StockCostTracking";
import StockSupplierInfo from "@/components/inventory/StockSupplierInfo";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [supplierInfo, setSupplierInfo] = useState<any>(null);
  const [usageData, setUsageData] = useState<any[]>([]);

  useEffect(() => {
    const fetchMaterialDetails = async () => {
      try {
        if (!id) return;
        
        const { data: materialData, error } = await supabase
          .from('inventory')
          .select('*, suppliers(name, contact_person)')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        setMaterial(materialData);
        if (materialData.supplier_id) {
          setSupplierInfo(materialData.suppliers);
        }
        
        // Fetch orders that use this material
        const { data: transactions, error: txError } = await supabase
          .from('inventory_transactions')
          .select(`
            id,
            quantity,
            transaction_type,
            created_at,
            notes,
            reference_id,
            orders:reference_id(order_number, company_name, quantity)
          `)
          .eq('material_id', id)
          .eq('transaction_type', 'order_consumption')
          .order('created_at', { ascending: false });
          
        if (txError) throw txError;
        
        setUsageData(transactions || []);
        
      } catch (error: any) {
        toast({
          title: "Error fetching material",
          description: error.message,
          variant: "destructive"
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterialDetails();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!material) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Material not found</h2>
          <p className="mt-2">The material you're looking for doesn't exist or has been removed.</p>
          <Button
            onClick={() => navigate("/inventory/stock")}
            className="mt-4"
          >
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => navigate("/inventory/stock")}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Details</h1>
          <p className="text-muted-foreground">
            View and update information for this inventory item
          </p>
        </div>
        <div className="flex-grow"></div>
        <Button onClick={() => navigate(`/inventory/stock/${id}/edit`)}>
          Edit Material
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <StockBasicInfo material={material} />
          </CardContent>
        </Card>

        <Tabs defaultValue="inventory">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="cost">Cost Tracking</TabsTrigger>
            <TabsTrigger value="orders">Orders Usage</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <StockInventoryManagement material={material} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cost" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <StockCostTracking material={material} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Orders Using This Material</h2>
                  
                  {usageData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Quantity Used</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageData.map(item => (
                          <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" 
                              onClick={() => item.orders?.order_number && navigate(`/orders/${item.reference_id}`)}>
                            <TableCell>
                              {item.orders?.order_number || 'Unknown Order'}
                            </TableCell>
                            <TableCell>{item.orders?.company_name || 'N/A'}</TableCell>
                            <TableCell>{item.quantity} {material.unit}</TableCell>
                            <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{item.notes || 'No notes'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-8 bg-muted/20 rounded-md">
                      <p>No orders have used this material yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="supplier" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <StockSupplierInfo 
                  material={material} 
                  supplierInfo={supplierInfo} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
