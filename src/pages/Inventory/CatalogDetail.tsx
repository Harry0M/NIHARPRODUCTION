
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const CatalogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["catalog-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast({
          title: "Error fetching product",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
  });

  // Fetch product components
  const { data: components, isLoading: componentsLoading } = useQuery({
    queryKey: ["catalog-components", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_components")
        .select("*")
        .eq("catalog_id", id);

      if (error) {
        toast({
          title: "Error fetching components",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
    enabled: !!id,
  });

  const isLoading = productLoading || componentsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center p-8">
        <p>Product not found</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => navigate("/inventory/catalog")}
        >
          Back to Catalog
        </Button>
      </div>
    );
  }

  // Group components by type
  const componentsByType = components?.reduce((acc, component) => {
    const type = component.component_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(component);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/inventory/catalog")}>
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{product.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{product.bag_length} × {product.bag_width} inches</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Height</p>
                <p className="font-medium">{product.height || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default Quantity</p>
                <p className="font-medium">{product.default_quantity || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default Rate</p>
                <p className="font-medium">₹{product.default_rate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="font-medium">₹{product.total_cost || 'N/A'}</p>
              </div>
            </div>

            {product.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{product.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cutting Charge</p>
                <p className="font-medium">₹{product.cutting_charge || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Printing Charge</p>
                <p className="font-medium">₹{product.printing_charge || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stitching Charge</p>
                <p className="font-medium">₹{product.stitching_charge || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transport Charge</p>
                <p className="font-medium">₹{product.transport_charge || '0'}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/inventory/catalog/edit/${product.id}`)}
              >
                Edit Product
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/inventory/catalog/${product.id}/orders`)}
              >
                <Package size={16} className="mr-2" />
                View Orders
              </Button>
              <Button 
                onClick={() => navigate("/orders/new", { state: { catalogId: product.id } })}
              >
                Create Order
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(componentsByType).length === 0 ? (
                <p className="text-muted-foreground">No components found</p>
              ) : (
                Object.entries(componentsByType).map(([type, comps]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="font-medium capitalize">{type}</h3>
                    {comps.map((comp) => (
                      <div key={comp.id} className="bg-muted p-3 rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {comp.color && (
                            <Badge variant="outline">Color: {comp.color}</Badge>
                          )}
                          {comp.gsm && (
                            <Badge variant="outline">GSM: {comp.gsm}</Badge>
                          )}
                          {comp.size && (
                            <Badge variant="outline">Size: {comp.size}</Badge>
                          )}
                          {comp.length && comp.width && (
                            <Badge variant="outline">
                              Size: {comp.length}×{comp.width}
                            </Badge>
                          )}
                          {comp.roll_width && (
                            <Badge variant="outline">Roll Width: {comp.roll_width}</Badge>
                          )}
                          {comp.consumption && (
                            <Badge variant="outline">Consumption: {comp.consumption}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CatalogDetail;
