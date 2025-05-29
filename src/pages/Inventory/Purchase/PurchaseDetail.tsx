
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface PurchaseDetail {
  id: string;
  purchase_number: string;
  purchase_date: string;
  status: string;
  total_amount: number;
  subtotal: number;
  transport_charge: number;
  notes?: string;
  suppliers: {
    id: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  } | null;
  purchase_items: {
    id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    material: {
      id: string;
      material_name: string;
      unit: string;
      color?: string;
      gsm?: string;
    };
  }[];
}

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: purchase, isLoading } = useQuery({
    queryKey: ["purchase", id],
    queryFn: async () => {
      if (!id) throw new Error("Purchase ID is required");
      
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          purchase_number,
          purchase_date,
          status,
          total_amount,
          subtotal,
          transport_charge,
          notes,
          suppliers (
            id,
            name,
            contact_person,
            phone,
            email
          ),
          purchase_items (
            id,
            quantity,
            unit_price,
            line_total,
            material:inventory (
              id,
              material_name,
              unit,
              color,
              gsm
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as PurchaseDetail;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id) throw new Error("Purchase ID is required");
      
      const { error } = await supabase
        .from("purchases")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: "Purchase status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update purchase status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      completed: "default",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Purchase not found</h2>
        <Button onClick={() => navigate("/inventory/purchase")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Purchases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/inventory/purchase")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{purchase.purchase_number}</h1>
            <p className="text-muted-foreground">
              Purchase Date: {format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(purchase.status)}
          {purchase.status === 'pending' && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => updateStatusMutation.mutate('completed')}
                disabled={updateStatusMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatusMutation.mutate('cancelled')}
                disabled={updateStatusMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {purchase.suppliers?.name || 'Unknown'}
            </div>
            {purchase.suppliers?.contact_person && (
              <div>
                <span className="font-medium">Contact Person:</span> {purchase.suppliers.contact_person}
              </div>
            )}
            {purchase.suppliers?.phone && (
              <div>
                <span className="font-medium">Phone:</span> {purchase.suppliers.phone}
              </div>
            )}
            {purchase.suppliers?.email && (
              <div>
                <span className="font-medium">Email:</span> {purchase.suppliers.email}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{purchase.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport Charge:</span>
              <span>₹{purchase.transport_charge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{purchase.total_amount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.purchase_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.material.material_name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.material.color && (
                        <Badge variant="outline" className="mr-1">
                          {item.material.color}
                        </Badge>
                      )}
                      {item.material.gsm && (
                        <Badge variant="outline">
                          {item.material.gsm} GSM
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.quantity} {item.material.unit}
                  </TableCell>
                  <TableCell>
                    ₹{item.unit_price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    ₹{item.line_total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {purchase.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PurchaseDetail;
