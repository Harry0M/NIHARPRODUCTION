
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PaginationControls from "@/components/ui/pagination-controls";
import { StockFormDialog } from "@/components/inventory/StockFormDialog";
import { StockDetailDialog } from "@/components/inventory/StockDetailDialog";
import { DeleteStockDialog } from "@/components/inventory/dialogs/DeleteStockDialog";

interface StockItem {
  id: string;
  material_name: string;
  color?: string;
  gsm?: string;
  quantity: number;
  unit: string;
  alternate_unit?: string;
  conversion_rate?: number;
  track_cost: boolean;
  purchase_price?: number;
  purchase_rate?: number;
  selling_price?: number;
  min_stock_level?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  roll_width?: number;
  rate?: number;
  status: string;
  category_id?: string;
  location_id?: string;
  supplier_id?: string;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    payment_terms?: string;
  };
}

const StockList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [viewingStock, setViewingStock] = useState<StockItem | null>(null);
  const [deletingStock, setDeletingStock] = useState<StockItem | null>(null);

  const { data: stocks = [], isLoading, refetch } = useQuery({
    queryKey: ["inventory-stocks"],
    queryFn: async () => {
      console.log("Fetching inventory stocks...");
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          id,
          material_name,
          color,
          gsm,
          quantity,
          unit,
          alternate_unit,
          conversion_rate,
          track_cost,
          purchase_price,
          purchase_rate,
          selling_price,
          min_stock_level,
          reorder_level,
          reorder_quantity,
          roll_width,
          rate,
          status,
          category_id,
          location_id,
          supplier_id,
          created_at,
          updated_at,
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone,
            address,
            payment_terms
          )
        `)
        .order('material_name');

      if (error) {
        console.error("Error fetching inventory stocks:", error);
        throw error;
      }
      
      console.log("Inventory stocks data:", data);
      return data as StockItem[];
    },
    placeholderData: [],
  });

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const searchLower = searchQuery.toLowerCase();
      return (
        stock.material_name.toLowerCase().includes(searchLower) ||
        (stock.color && stock.color.toLowerCase().includes(searchLower)) ||
        (stock.gsm && stock.gsm.toLowerCase().includes(searchLower))
      );
    });
  }, [stocks, searchQuery]);

  const totalItems = filteredStocks.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedStocks = filteredStocks.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleStockCreated = () => {
    refetch();
    setStockFormOpen(false);
  };

  const handleStockUpdated = () => {
    refetch();
    setEditingStock(null);
  };

  const handleStockDeleted = () => {
    refetch();
    setDeletingStock(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in_stock: "default",
      out_of_stock: "destructive",
      low_stock: "outline",
      discontinued: "secondary"
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace('_', ' ')}</Badge>;
  };

  const getStockLevel = (stock: StockItem) => {
    if (stock.quantity === 0) return "out_of_stock";
    if (stock.reorder_level && stock.quantity <= stock.reorder_level) return "low_stock";
    return "in_stock";
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
        <h1 className="text-3xl font-bold">Inventory Stock</h1>
        <Button onClick={() => setStockFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Stock
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Stock Items</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by material name, color, or GSM..."
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
                <TableHead>Material</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    {stock.material_name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {stock.color && (
                        <Badge variant="outline" className="mr-1">
                          {stock.color}
                        </Badge>
                      )}
                      {stock.gsm && (
                        <Badge variant="outline">
                          {stock.gsm} GSM
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {stock.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {stock.unit}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(getStockLevel(stock))}
                  </TableCell>
                  <TableCell>
                    {stock.suppliers?.name || 'No supplier'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingStock(stock)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStock(stock)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingStock(stock)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalCount={totalItems}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <StockFormDialog
        open={stockFormOpen}
        onOpenChange={setStockFormOpen}
        onStockCreated={handleStockCreated}
      />

      <StockFormDialog
        open={!!editingStock}
        onOpenChange={(open) => !open && setEditingStock(null)}
        onStockCreated={handleStockUpdated}
        editingStock={editingStock}
      />

      <StockDetailDialog
        open={!!viewingStock}
        onOpenChange={(open) => !open && setViewingStock(null)}
        stock={viewingStock}
      />

      <DeleteStockDialog
        open={!!deletingStock}
        onOpenChange={(open) => !open && setDeletingStock(null)}
        stock={deletingStock}
        onDeleted={handleStockDeleted}
      />
    </div>
  );
};

export default StockList;
