
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package, Eye, Edit, Trash2, DollarSign, Layers, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { showToast } from "@/components/ui/enhanced-toast";
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

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  bag_length: number;
  bag_width: number;
  height: number;
  border_dimension: number;
  default_quantity: number | null;
  default_rate: number | null;
  total_cost: number | null;
  material_cost: number;
  cutting_charge: number;
  printing_charge: number;
  stitching_charge: number;
  transport_charge: number;
  selling_rate: number | null;
  margin: number | null;
  created_at: string;
  updated_at: string;
}

export const CatalogList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const {
    data: catalogData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["catalog", searchTerm, sortBy, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("catalog")
        .select("*");

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      return data as CatalogProduct[];
    },
  });

  const {
    currentData,
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination({
    data: catalogData || [],
    initialItemsPerPage: 12,
  });

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase.rpc('delete_catalog_product', {
        input_catalog_id: productId
      });

      if (error) throw error;

      showToast({
        title: "Product deleted",
        description: "Catalog product has been deleted successfully",
        type: "success"
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      showToast({
        title: "Error",
        description: error.message || "Failed to delete product",
        type: "error"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Error loading catalog: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm ? "No products match your search criteria." : "Get started by creating your first product."}
        </p>
        <Button asChild>
          <Link to="/dashboard/catalog/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  // Simple pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, catalogData?.length || 0)} of {catalogData?.length || 0} results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your product templates and configurations</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/catalog/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Link>
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="selling_rate">Price</SelectItem>
                  <SelectItem value="total_cost">Cost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {currentData && currentData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link to={`/dashboard/catalog/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link to={`/dashboard/catalog/${product.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {product.bag_length}" × {product.bag_width}"
                        </span>
                      </div>
                      {product.height > 0 && (
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">H: {product.height}"</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing Information */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost:</span>
                        <span className="font-medium">₹{(product.total_cost || product.selling_rate || 0).toFixed(2)}</span>
                      </div>
                      {product.selling_rate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Selling Rate:</span>
                          <span className="font-medium text-green-600">₹{(product.selling_rate || product.total_cost || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {product.margin && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Margin:</span>
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ₹{product.margin.toFixed(2)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Default Quantity */}
                    {product.default_quantity && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Default Qty:</span>
                        <Badge variant="secondary">{product.default_quantity}</Badge>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Material: ₹{product.material_cost.toFixed(2)}</div>
                      <div>Cutting: ₹{product.cutting_charge.toFixed(2)}</div>
                      <div>Printing: ₹{product.printing_charge.toFixed(2)}</div>
                      <div>Stitching: ₹{product.stitching_charge.toFixed(2)}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to={`/dashboard/catalog/${product.id}/orders`}>
                          View Orders
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
