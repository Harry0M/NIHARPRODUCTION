import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { generatePurchasePDF } from "@/utils/professionalPdfUtils";
import { showToast } from "@/components/ui/enhanced-toast";

interface InventoryItem {
  id: string;
  material_name: string;
  color: string;
  main_unit: string;
  alternative_unit: string;
  main_to_alternative_ratio: number;
}

interface PurchaseItem {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  material: InventoryItem;
}

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  transport_charge: number;
  subtotal: number;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: string;
  notes: string;
  suppliers: {
    id: string;
    name: string;
    contact_person: string;
    phone: string;
    address: string;
  };
  purchase_items: PurchaseItem[];
}

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (*),
          purchase_items (
            id,
            material_id,
            quantity,
            unit_price,
            line_total,
            material:inventory (
              id,
              material_name,
              color,
              main_unit,
              alternative_unit,
              main_to_alternative_ratio
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as Purchase;
    },
    enabled: !!id,
  });
  
  useEffect(() => {
    if (data) {
      setPurchase(data);
    }
  }, [data]);
  
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      showToast({
        title: "Status Updated",
        description: `Purchase status changed to ${newStatus}`,
        type: "success"
      });
      
      refetch();
    } catch (error: any) {
      console.error("Error updating purchase status:", error);
      showToast({
        title: "Error",
        description: error.message || "Failed to update purchase status",
        type: "error"
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }
  
  if (error || !purchase) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Purchase Not Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The requested purchase could not be found or an error occurred.
            </p>
            <Button
              onClick={() => navigate("/inventory/purchases")}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchases
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate("/inventory/purchases")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchases
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => generatePurchasePDF({
              purchase_number: purchase.purchase_number,
              supplier_name: purchase.suppliers.name,
              supplier_contact: purchase.suppliers.contact_person,
              supplier_phone: purchase.suppliers.phone,
              supplier_address: purchase.suppliers.address,
              purchase_date: purchase.purchase_date,
              status: purchase.status,
              transport_charge: purchase.transport_charge,
              subtotal: purchase.subtotal,
              total_amount: purchase.total_amount,
              notes: purchase.notes,
              purchase_items: purchase.purchase_items.map(item => ({
                material_name: item.material?.material_name || 'Unknown Material',
                quantity: item.quantity,
                unit: item.material?.main_unit || 'unit',
                unit_price: item.unit_price,
                line_total: item.line_total
              }))
            }, `purchase-${purchase.purchase_number}`)}
          >
            <Printer className="h-4 w-4" />
            Print PDF
          </Button>
          
          {purchase.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleStatusChange("cancelled")}
              >
                Cancel Purchase
              </Button>
              <Button 
                onClick={() => handleStatusChange("completed")}
              >
                Mark as Completed
              </Button>
            </>
          )}
          
          {purchase.status === "cancelled" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("pending")}
            >
              Reactivate Purchase
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{purchase.purchase_number}</CardTitle>
              <CardDescription>
                Purchase created on{" "}
                {new Date(purchase.created_at).toLocaleDateString()} at{" "}
                {new Date(purchase.created_at).toLocaleTimeString()}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeClass(purchase.status)}>
              {purchase.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Supplier Information</h3>
                <p className="text-lg font-medium">{purchase.suppliers.name}</p>
                {purchase.suppliers.contact_person && (
                  <p>{purchase.suppliers.contact_person}</p>
                )}
                {purchase.suppliers.phone && (
                  <p>{purchase.suppliers.phone}</p>
                )}
                {purchase.suppliers.address && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {purchase.suppliers.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Purchase Details</h3>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p>{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Number</p>
                    <p>{purchase.purchase_number}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Purchase Items</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Main Unit</TableHead>
                    <TableHead>Alt. Quantity</TableHead>
                    <TableHead>Alt. Unit</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.purchase_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.material ? item.material.material_name : "Material not found"}
                        {item.material?.color && (
                          <span className="text-muted-foreground"> - {item.material.color}</span>
                        )}
                      </TableCell>
                      <TableCell>{item.quantity.toFixed(2)}</TableCell>
                      <TableCell>{item.material?.main_unit || "N/A"}</TableCell>
                      <TableCell>
                        {item.material ? 
                          (item.quantity / (item.material.main_to_alternative_ratio || 1)).toFixed(2) : 
                          "N/A"
                        }
                      </TableCell>
                      <TableCell>{item.material?.alternative_unit || "N/A"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.line_total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {purchase.notes && (
                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                  <p className="whitespace-pre-line">{purchase.notes}</p>
                </div>
              )}
            </div>
            
            <div>
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(purchase.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transport Charge:</span>
                  <span>{formatCurrency(purchase.transport_charge || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(purchase.total_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseDetail;
