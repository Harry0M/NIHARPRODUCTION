import { useParams, useNavigate } from "react-router-dom";
import { useCatalogProducts, useInventoryItems, CatalogProduct } from "@/hooks/use-catalog-products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Pencil, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { ProductInfoCard } from "@/components/inventory/catalog/ProductInfoCard";
import { ComponentsTable, CatalogComponent } from "@/components/inventory/catalog/ComponentsTable";
import { ComponentDetailsDialog } from "@/components/inventory/catalog/ComponentDetailsDialog";
import { showToast } from "@/components/ui/enhanced-toast";
import { useQueryClient } from "@tanstack/react-query";

// Update Material interface to match the changes in ComponentsTable.tsx
interface Material {
  id: string;
  material_name: string; // Changed from material_type to material_name
  color?: string | null;
  gsm?: string | null;
  quantity?: number;
  unit?: string;
}

const CatalogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [componentView, setComponentView] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading, refetch } = useCatalogProducts();
  const { data: inventoryItems, isLoading: isLoadingInventory } = useInventoryItems();
  
  // More robust product finding - compare as strings to avoid type mismatches
  const product = products?.find((p) => String(p.id) === String(id)) as CatalogProduct | undefined;
  const components = product?.catalog_components || [];

  // Enhanced debugging information
  console.log("CatalogDetail - Product ID:", id);
  console.log("CatalogDetail - Products length:", products?.length);
  console.log("CatalogDetail - All product IDs:", products?.map(p => p.id));
  console.log("CatalogDetail - Found product:", product);
  
  if (!product && products?.length) {
    console.warn("Product not found by ID match! This may indicate a type mismatch or database inconsistency.");
    // Try to look up by ID in a different way just to debug
    const looseMatch = products.find(p => p.id.toString().includes(id?.toString() || ""));
    if (looseMatch) {
      console.warn("Found product with loose matching:", looseMatch.id, "vs requested ID:", id);
    }
  }
  
  console.log("CatalogDetail - Components:", components?.length);
  console.log("CatalogDetail - Available inventory items:", inventoryItems?.length);

  // Force refresh on initial load and also check for new product notification
  useEffect(() => {
    if (id) {
      console.log("Initial data load - forcing refresh");
      setIsRefreshing(true);
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      
      refetch()
        .then((result) => {
          if (result.isSuccess) {
            console.log("Data refreshed successfully");
          } else if (result.isError) {
            console.error("Error refreshing data:", result.error);
            showToast({
              title: "Error loading product data",
              description: "Please try refreshing the page",
              type: "error"
            });
          }
        })
        .catch(error => {
          console.error("Error during refetch:", error);
        })
        .finally(() => {
          setIsRefreshing(false);
        });
      
      // Check for product created notification
      const hasRedirected = sessionStorage.getItem('productCreated');
      if (hasRedirected) {
        sessionStorage.removeItem('productCreated');
        showToast({
          title: "Product viewed successfully",
          description: "You are now viewing the newly created product",
          type: "success"
        });
      }
    }
  }, [id, refetch, queryClient]);

  useEffect(() => {
    // Detect if we have components with material_id but no materials
    const hasOrphanedMaterialIds = components.some(c => c.material_id && c.material_linked && !c.material);
    
    if (hasOrphanedMaterialIds) {
      console.warn("Detected components with material_id but no attached material data.");
    }
  }, [components]);

  const componentTypes = {
    part: "Part",
    border: "Border",
    handle: "Handle",
    chain: "Chain",
    runner: "Runner",
    custom: "Custom"
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-2xl font-semibold text-muted-foreground">Product not found</div>
        <Button onClick={() => navigate("/inventory/catalog")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Button>
      </div>
    );
  }

  const handleViewComponent = (componentId: string) => {
    setComponentView(componentId);
    setIsDialogOpen(true);
  };

  const getSelectedComponent = (): CatalogComponent | null => {
    return components.find(c => c.id === componentView) || null;
  };

  // Handle successful material link with stronger refresh
  const handleMaterialLinkSuccess = () => {
    console.log("Material link success, refreshing data...");
    
    // Force immediate refetch with no delay
    setIsRefreshing(true);
    
    // First invalidate the queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    queryClient.invalidateQueries({ queryKey: ["stock-detail", componentView] });
    
    refetch({ cancelRefetch: true })
      .then((result) => {
        console.log("Data refreshed after linking material:", result);
        setIsRefreshing(false);
        
        if (result.isSuccess) {
          showToast({
            title: "Material linked successfully",
            description: "The component has been updated with the selected material",
            type: "success"
          });
        } else if (result.isError) {
          showToast({
            title: "Error refreshing data",
            description: "Unable to reload data. Please try manually refreshing.",
            type: "error"
          });
        }
      })
      .catch(error => {
        console.error("Error refetching data:", error);
        setIsRefreshing(false);
        showToast({
          title: "Error refreshing data",
          description: "Unable to refresh the data. Please try manually refreshing.",
          type: "error"
        });
      })
      .finally(() => {
        // Close the dialog after attempt to refresh
        setIsDialogOpen(false);
      });
  };

  // Manual refresh function with stronger implementation
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    
    // Clear cache and force refetch
    queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    queryClient.invalidateQueries({ queryKey: ["stock-detail"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    
    refetch({ cancelRefetch: true, throwOnError: true })
      .then((result) => {
        setIsRefreshing(false);
        
        if (result.isSuccess) {
          showToast({
            title: "Data refreshed",
            description: "The product details have been refreshed",
            type: "success"
          });
        } else if (result.isError) {
          showToast({
            title: "Error refreshing data",
            description: result.error?.message || "An error occurred while refreshing the data",
            type: "error"
          });
        }
      })
      .catch(error => {
        setIsRefreshing(false);
        showToast({
          title: "Error refreshing data",
          description: error.message || "An error occurred while refreshing the data",
          type: "error"
        });
      });
  };

  // Filter materials based on component properties
  const getFilteredMaterials = (component: CatalogComponent) => {
    if (!inventoryItems) return [];
    
    // Safely cast the inventory items to the correct type
    return inventoryItems as unknown as Material[];
  };

  const selectedComponent = getSelectedComponent();
  const filteredMaterials = selectedComponent ? getFilteredMaterials(selectedComponent) : [];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/inventory/catalog")}
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/inventory/catalog/${id}/orders`)}
          >
            <Package size={18} className="mr-2" /> View Orders
          </Button>
          <Button
            variant="default"
            onClick={() => navigate(`/inventory/catalog/${id}/edit`)}
          >
            <Pencil size={18} className="mr-2" /> Edit Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Information Card */}
        <ProductInfoCard 
          name={product.name}
          bagLength={product.bag_length}
          bagWidth={product.bag_width}
          borderDimension={product.border_dimension}
          defaultQuantity={product.default_quantity}
          defaultRate={product.default_rate}
          createdAt={product.created_at}
          sellingRate={product.selling_rate}
          totalCost={product.total_cost}
          margin={product.margin}
          description={product.description}
          // Complete cost breakdown fields
          materialCost={product.total_cost ? (product.total_cost - (product.cutting_charge || 0) - (product.printing_charge || 0) - (product.stitching_charge || 0) - (product.transport_charge || 0)) : null}
          cuttingCharge={product.cutting_charge}
          printingCharge={product.printing_charge}
          stitchingCharge={product.stitching_charge}
          transportCharge={product.transport_charge}
          productionCost={product.cutting_charge && product.printing_charge && product.stitching_charge && product.transport_charge ?
            product.cutting_charge + product.printing_charge + product.stitching_charge + product.transport_charge : null}
        />

        {/* Components Card */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent>
            <ComponentsTable 
              components={components} 
              onViewComponent={handleViewComponent} 
              onLinkMaterial={handleViewComponent}
              defaultQuantity={product.default_quantity}
            />
          </CardContent>
        </Card>
      </div>

      {/* Component Details Dialog */}
      <ComponentDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedComponent={selectedComponent}
        filteredMaterials={filteredMaterials}
        isLoadingInventory={isLoadingInventory}
        onMaterialLinkSuccess={handleMaterialLinkSuccess}
        componentTypes={componentTypes}
      />
    </div>
  );
};

export default CatalogDetail;
