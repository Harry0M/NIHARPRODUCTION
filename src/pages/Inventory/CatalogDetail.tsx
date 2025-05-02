
import { useParams, useNavigate } from "react-router-dom";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CatalogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [componentView, setComponentView] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: products, isLoading } = useCatalogProducts();
  
  const product = products?.find((p) => p.id === id);
  const components = product?.catalog_components || [];

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

  const getSelectedComponent = () => {
    return components.find(c => c.id === componentView) || null;
  };

  const selectedComponent = getSelectedComponent();

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
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Size (L×W)</p>
                <p className="font-medium">{product.bag_length} × {product.bag_width} inches</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Border Dimension</p>
                <p className="font-medium">{product.border_dimension || 'N/A'} inches</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Default Quantity</p>
                <p className="font-medium">{product.default_quantity || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Default Rate</p>
                <p className="font-medium">{product.default_rate ? `₹${product.default_rate}` : 'N/A'}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created On</p>
                <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components Card */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>GSM</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No components found
                    </TableCell>
                  </TableRow>
                ) : (
                  components.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell>
                        {component.component_type === 'custom' 
                          ? `Custom (${component.custom_name})` 
                          : componentTypes[component.component_type as keyof typeof componentTypes]}
                      </TableCell>
                      <TableCell>{component.size || 'N/A'}</TableCell>
                      <TableCell>{component.color || 'N/A'}</TableCell>
                      <TableCell>{component.gsm || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewComponent(component.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Component Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedComponent?.component_type === 'custom'
                ? `Custom Component: ${selectedComponent.custom_name}`
                : `${componentTypes[selectedComponent?.component_type as keyof typeof componentTypes]} Details`}
            </DialogTitle>
          </DialogHeader>
          {selectedComponent && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Size</p>
                <p className="font-medium">{selectedComponent.size || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Color</p>
                <p className="font-medium">{selectedComponent.color || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">GSM</p>
                <p className="font-medium">{selectedComponent.gsm || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Roll Width</p>
                <p className="font-medium">{selectedComponent.roll_width || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Length</p>
                <p className="font-medium">{selectedComponent.length || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Width</p>
                <p className="font-medium">{selectedComponent.width || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Consumption</p>
                <p className="font-medium">{selectedComponent.consumption || 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogDetail;
