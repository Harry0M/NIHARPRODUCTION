
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  status: string;
  total_amount: number;
  supplier_id: string;
  suppliers: {
    name: string;
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
    };
  }[];
}

const PurchaseList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          purchase_number,
          purchase_date,
          status,
          total_amount,
          supplier_id,
          suppliers (
            name
          ),
          purchase_items (
            id,
            quantity,
            unit_price,
            line_total,
            material:inventory (
              id,
              material_name,
              unit
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Purchase[];
    },
  });

  const filteredPurchases = purchases.filter(purchase =>
    purchase.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.suppliers?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Button onClick={() => navigate("/inventory/purchase/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Purchases</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by purchase number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.purchase_number}
                  </TableCell>
                  <TableCell>
                    {format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    {purchase.suppliers?.name || 'Unknown Supplier'}
                  </TableCell>
                  <TableCell>
                    {purchase.purchase_items?.length || 0} items
                  </TableCell>
                  <TableCell>
                    ₹{purchase.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(purchase.status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/inventory/purchase/${purchase.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseList;
