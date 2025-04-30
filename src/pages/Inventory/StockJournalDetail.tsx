
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { 
  Package, 
  ArrowLeft, 
  Trash2, 
  AlertCircle,
  Calendar,
  Tag,
  Ruler,
  Scale,
  Palette
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const StockJournalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Stock entry deleted",
        description: "The inventory item has been deleted successfully.",
      });
      navigate('/inventory/stock/journal/list');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete inventory item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteInventoryMutation.mutate();
  };

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
            <CardTitle>{inventory.material_type}</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/inventory/stock/journal/list')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this inventory item? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardDescription>
          Detailed information about this inventory item.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Basic Information</h3>
              <Separator className="my-2" />
              <div className="space-y-2">
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-2">Material Type:</span>
                  <span>{inventory.material_type}</span>
                </div>
                {inventory.color && (
                  <div className="flex items-center">
                    <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Color:</span>
                    <span>{inventory.color}</span>
                  </div>
                )}
                {inventory.gsm && (
                  <div className="flex items-center">
                    <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">GSM:</span>
                    <span>{inventory.gsm}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-2">Quantity:</span>
                  <span>{inventory.quantity} {inventory.unit}</span>
                  {inventory.reorder_level && inventory.quantity <= inventory.reorder_level && (
                    <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                  )}
                </div>
                {inventory.alternate_unit && (
                  <div className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Alternate Unit:</span>
                    <span>
                      {inventory.alternate_unit} (1 {inventory.unit} = {inventory.conversion_rate} {inventory.alternate_unit})
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-2">Created At:</span>
                  <span>{new Date(inventory.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {inventory.track_cost && (
              <div>
                <h3 className="text-lg font-medium">Cost Tracking</h3>
                <Separator className="my-2" />
                <div className="space-y-2">
                  {inventory.purchase_price && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Purchase Price:</span>
                      <span>${inventory.purchase_price.toFixed(2)}</span>
                    </div>
                  )}
                  {inventory.selling_price && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Selling Price:</span>
                      <span>${inventory.selling_price.toFixed(2)}</span>
                    </div>
                  )}
                  {inventory.purchase_price && inventory.selling_price && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Profit Margin:</span>
                      <span>
                        {((inventory.selling_price - inventory.purchase_price) / inventory.purchase_price * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {inventory.reorder_level && (
              <div>
                <h3 className="text-lg font-medium">Inventory Management</h3>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Reorder Level:</span>
                    <span>{inventory.reorder_level} {inventory.unit}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Status:</span>
                    {inventory.quantity <= inventory.reorder_level ? (
                      <Badge variant="destructive">Reorder Required</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">In Stock</Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Stock Quantity:</span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${inventory.quantity <= inventory.reorder_level ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(inventory.quantity / (inventory.reorder_level * 2) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {inventory.suppliers && (
              <div>
                <h3 className="text-lg font-medium">Supplier Information</h3>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Supplier:</span>
                    <span>{inventory.suppliers.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockJournalDetail;
