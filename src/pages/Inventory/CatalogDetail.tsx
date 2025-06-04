import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCatalogProducts, useInventoryItems, CatalogProduct } from "@/hooks/use-catalog-products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Pencil, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { ProductInfoCard } from "@/components/inventory/catalog/ProductInfoCard";
import { ComponentsTable, CatalogComponent } from "@/components/inventory/catalog/ComponentsTable";
import { ComponentDetailsDialog } from "@/components/inventory/catalog/ComponentDetailsDialog";
import { showToast } from "@/components/ui/enhanced-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Update Material interface to match the changes in ComponentsTable.tsx
interface Material {
  id: string;
  material_name: string;
  color?: string | null;
  gsm?: string | null;
  quantity?: number;
  unit?: string;
  roll_width?: number | null;
}

// Define the component type from the database
interface DBComponent {
  id: string;
  catalog_id: string;
  component_type: string;
  color: string;
  consumption: number;
  created_at: string;
  custom_name: string;
  formula: string;
  gsm: number;
  length: number;
  material_id: string;
  material_linked: boolean;
  roll_width: number;
  width: number;
}

const CatalogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);

  // Get the force refresh state from navigation
  const forceRefresh = location.state?.forceRefresh || false;

  // Single source of truth for product data
  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['catalog-product', id],
    queryFn: async () => {
      // First, get the product with its components
      const { data: productData, error: productError } = await supabase
        .from('catalog')
        .select(`
          *,
          catalog_components(*)
        `)
        .eq('id', id)
        .single();
      
      if (productError) throw productError;
      
      // If there are no components, return early
      if (!productData?.catalog_components?.length) {
        return productData;
      }
      
      // Get all material IDs from components
      const materialIds = productData.catalog_components
        .map((comp: any) => comp.material_id)
        .filter(Boolean);
      
      // If no material IDs, return the product as is
      if (materialIds.length === 0) {
        return productData;
      }
      
      // Fetch all materials in one query
      const { data: materials, error: materialsError } = await supabase
        .from('inventory')
        .select('*')
        .in('id', materialIds);
      
      if (materialsError) throw materialsError;
      
      // Create a map of material ID to material data
      const materialsMap = new Map(
        materials.map((mat: any) => [mat.id, mat])
      );
      
      // Add material data to components
      const componentsWithMaterials = productData.catalog_components.map((comp: any) => ({
        ...comp,
        material: comp.material_id ? materialsMap.get(comp.material_id) || null : null
      }));
      
      return {
        ...productData,
        catalog_components: componentsWithMaterials
      };
    },
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes
  });

  // Only fetch inventory items when needed
  const { data: inventoryItems, isLoading: isLoadingInventoryItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: showComponentDialog, // Only fetch when dialog is open
  });

  // Force refetch on mount if coming from edit
  useEffect(() => {
    if (forceRefresh) {
      refetch();
    }
  }, [forceRefresh, refetch]);

  // Convert DB components to CatalogComponent type
  const components: CatalogComponent[] = (product?.catalog_components || []).map(comp => {
    const component: CatalogComponent = {
      ...comp,
      formula: (comp.formula === 'linear' ? 'linear' : 'standard') as 'standard' | 'linear'
    };
    
    // If material data is available, add it to the component
    if (comp.material) {
      component.material = {
        id: comp.material.id,
        material_name: comp.material.material_name,
        color: comp.material.color,
        gsm: comp.material.gsm,
        quantity: comp.material.quantity,
        unit: comp.material.unit,
        roll_width: comp.material.roll_width
      };
    }
    
    return component;
  });

  // Enhanced debugging information
  console.log("CatalogDetail - Product ID:", id);
  console.log("CatalogDetail - Product data:", product);
  console.log("CatalogDetail - Components:", components?.length);

  // Loading state
  if (isLoading || isRefreshing) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
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
    setSelectedComponentId(componentId);
    setShowComponentDialog(true);
  };

  const getSelectedComponent = (): CatalogComponent | null => {
    const comp = components.find(c => c.id === selectedComponentId);
    return comp || null;
  };

  // Handle successful material link with stronger refresh
  const handleMaterialLinkSuccess = () => {
    console.log("Material link success, refreshing data...");
    setIsRefreshing(true);
    
    // First invalidate the queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    queryClient.invalidateQueries({ queryKey: ["stock-detail", selectedComponentId] });
    
    refetch()
      .then(() => {
        setIsRefreshing(false);
        setShowComponentDialog(false);
      })
      .catch(error => {
        console.error("Error refetching data:", error);
        setIsRefreshing(false);
        showToast({
          title: "Error refreshing data",
          description: "Unable to refresh the data. Please try manually refreshing.",
          type: "error"
        });
      });
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    
    // Clear cache and force refetch
    queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    queryClient.invalidateQueries({ queryKey: ["stock-detail"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    
    refetch()
      .then(() => {
        setIsRefreshing(false);
        showToast({
          title: "Data refreshed",
          description: "The product details have been refreshed",
          type: "success"
        });
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
    return inventoryItems as unknown as Material[];
  };

  const selectedComponent = getSelectedComponent();
  const filteredMaterials = selectedComponent ? getFilteredMaterials(selectedComponent) : [];

  const componentTypes = {
    part: "Part",
    border: "Border",
    handle: "Handle",
    chain: "Chain",
    runner: "Runner",
    custom: "Custom"
  };

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
        open={showComponentDialog}
        onOpenChange={setShowComponentDialog}
        selectedComponent={selectedComponent}
        filteredMaterials={filteredMaterials}
        isLoadingInventory={isLoadingInventoryItems}
        onMaterialLinkSuccess={handleMaterialLinkSuccess}
        componentTypes={componentTypes}
      />
    </div>
  );
};

export default CatalogDetail;
