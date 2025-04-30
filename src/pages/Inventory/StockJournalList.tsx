
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package, Search, Info, Trash2 } from "lucide-react";

interface InventoryItem {
  id: string;
  material_type: string;
  color: string | null;
  gsm: string | null;
  quantity: number;
  unit: string;
  alternate_unit: string | null;
  conversion_rate: number;
  track_cost: boolean;
  purchase_price: number | null;
  selling_price: number | null;
  supplier_id: string | null;
  suppliers?: { name: string } | null;
  reorder_level: number | null;
  created_at: string;
  updated_at: string;
}

const StockJournalList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
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
        description: "The inventory item has been removed successfully.",
      });
      setDeleteItemId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete inventory item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Filter inventory based on search term and filter type
  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = 
      item.material_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.gsm && item.gsm.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (filterType === "all") return matchesSearch;
    if (filterType === "tracked") return matchesSearch && item.track_cost;
    if (filterType === "untracked") return matchesSearch && !item.track_cost;
    if (filterType === "low") return matchesSearch && item.reorder_level && item.quantity <= item.reorder_level;
    
    return matchesSearch;
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span>Stock Journal</span>
          </CardTitle>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="pl-8 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                <SelectItem value="tracked">Cost Tracked</SelectItem>
                <SelectItem value="untracked">Not Tracked</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInventory?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>GSM</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Primary Unit</TableHead>
                  <TableHead>Alt. Unit</TableHead>
                  <TableHead>Cost Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-left font-medium"
                            onClick={() => setSelectedItem(item)}
                          >
                            {item.material_type}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              {item.material_type} Details
                            </DialogTitle>
                            <DialogDescription>
                              Complete information about this inventory item
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedItem && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Material Type</h4>
                                  <p className="mt-1">{selectedItem.material_type}</p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Quantity</h4>
                                  <p className="mt-1">{selectedItem.quantity} {selectedItem.unit}</p>
                                </div>
                                
                                {selectedItem.color && (
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Color</h4>
                                    <p className="mt-1">{selectedItem.color}</p>
                                  </div>
                                )}
                                
                                {selectedItem.gsm && (
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">GSM</h4>
                                    <p className="mt-1">{selectedItem.gsm}</p>
                                  </div>
                                )}
                                
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Primary Unit</h4>
                                  <p className="mt-1">{selectedItem.unit}</p>
                                </div>
                                
                                {selectedItem.alternate_unit && (
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Alternative Unit</h4>
                                    <p className="mt-1">
                                      {selectedItem.alternate_unit}
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (1:{selectedItem.conversion_rate})
                                      </span>
                                    </p>
                                  </div>
                                )}
                                
                                {selectedItem.track_cost && (
                                  <>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
                                      <p className="mt-1">
                                        {selectedItem.purchase_price ? `${selectedItem.purchase_price}` : "Not set"}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Selling Price</h4>
                                      <p className="mt-1">
                                        {selectedItem.selling_price ? `${selectedItem.selling_price}` : "Not set"}
                                      </p>
                                    </div>
                                  </>
                                )}
                                
                                {selectedItem.suppliers && (
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Supplier</h4>
                                    <p className="mt-1">{selectedItem.suppliers.name}</p>
                                  </div>
                                )}
                                
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Reorder Level</h4>
                                  <p className="mt-1">
                                    {selectedItem.reorder_level !== null ? selectedItem.reorder_level : "Not set"}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
                                  <p className="mt-1">{formatDate(selectedItem.created_at)}</p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Updated At</h4>
                                  <p className="mt-1">{formatDate(selectedItem.updated_at)}</p>
                                </div>
                              </div>
                              
                              {selectedItem.reorder_level !== null && selectedItem.quantity <= selectedItem.reorder_level && (
                                <div className="rounded-md bg-amber-50 p-4 mt-2">
                                  <div className="flex">
                                    <Info className="h-5 w-5 text-amber-400" />
                                    <div className="ml-3">
                                      <h3 className="text-sm font-medium text-amber-800">Low stock warning</h3>
                                      <p className="text-sm mt-1 text-amber-700">
                                        Current quantity ({selectedItem.quantity}) is below the reorder level ({selectedItem.reorder_level}).
                                        Consider restocking this material.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <DialogFooter className="sm:justify-end">
                            <Button type="button" variant="outline">
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this stock entry? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => selectedItem && handleDelete(selectedItem.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>{item.color || '—'}</TableCell>
                    <TableCell>{item.gsm || '—'}</TableCell>
                    <TableCell>
                      {item.quantity}
                      {item.reorder_level && item.quantity <= item.reorder_level && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Low
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.alternate_unit ? (
                        <span className="flex items-center">
                          {item.alternate_unit}
                          <span className="text-xs text-muted-foreground ml-1">
                            (1:{item.conversion_rate})
                          </span>
                        </span>
                      ) : '—'}
                    </TableCell>
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
                      {item.reorder_level && item.quantity <= item.reorder_level ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Reorder
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteItemId(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this stock entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteItemId && handleDelete(deleteItemId)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockJournalList;
