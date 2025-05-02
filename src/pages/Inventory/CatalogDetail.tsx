import { useParams, useNavigate } from "react-router-dom";
import { useCatalogProducts, useInventoryItems } from "@/hooks/use-catalog-products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ProductInfoCard } from "@/components/inventory/catalog/ProductInfoCard";
import { ComponentsTable, CatalogComponent } from "@/components/inventory/catalog/ComponentsTable";
import { ComponentDetailsDialog } from "@/components/inventory/catalog/ComponentDetailsDialog";

interface CatalogProduct {
  id: string;
  name: string;
  description?: string | null;
  bag_length: number;
  bag_width: number;
  border_dimension?: number | null;
  default_quantity?: number | null;
  default_rate?: number | null;
  created_at: string;
  updated_at: string;
  catalog_components?: CatalogComponent[];
}

const CatalogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [componentView, setComponentView] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: products, isLoading, refetch } = useCatalogProducts();
  const { data: inventoryItems, isLoading: isLoadingInventory } = useInventoryItems();
  
  const product = products?.find((p) => p.id === id) as CatalogProduct | undefined;
  const components = product?.catalog_components || [];

  // Add debugging
  console.log("Product ID:", id);
  console.log("Found product:", product);
  console.log("Components:", components);
  console.log("Components with materials:", components.filter(c => c.material || c.material_id));

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

  // Handle successful material link
  const handleMaterialLinkSuccess = () => {
    console.log("Material link success, refreshing data...");
    refetch().then(() => {
      console.log("Data refreshed after linking material");
    }).catch(error => {
      console.error("Error refetching data:", error);
    });
  };

  // Filter materials based on component properties
  const getFilteredMaterials = (component: CatalogComponent) => {
    if (!inventoryItems) return [];
    
    return inventoryItems.filter(item => {
      // Match by material type if possible
      if (component.component_type === 'part' && item.material_type.toLowerCase().includes('non-woven')) {
        return true;
      }
      
      // Match by color if specified
      if (component.color && item.color && item.color.toLowerCase() === component.color.toLowerCase()) {
        return true;
      }
      
      // Match by GSM if specified - Convert both to string for comparison
      if (component.gsm && item.gsm) {
        // Convert both to string before comparison to avoid type mismatch
        return String(item.gsm) === String(component.gsm);
      }
      
      // Otherwise just return all materials as options
      return true;
    });
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
