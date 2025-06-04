
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { ProductSelectDialog } from "./ProductSelectDialog";

interface Product {
  id: string;
  name: string;
  bag_length?: number;
  bag_width?: number;
  border_dimension?: number;
  default_rate?: number;
  default_quantity?: number;
  catalog_components?: Array<{
    id: string;
    component_type: string;
    size?: string;
    color?: string;
    gsm?: number;
    custom_name?: string;
    roll_width?: number;
    length?: number;
    width?: number;
    consumption?: number;
    material_id?: string;
    material?: {
      id: string;
      material_name: string;
      color?: string;
      gsm?: string;
      quantity?: number;
      unit?: string;
      roll_width?: number;
    };
    material_linked?: boolean;
  }>;
}

interface ProductSelectorProps {
  catalogProducts: Product[] | undefined;
  isLoading: boolean;
  onProductSelect: (productId: string) => void;
  selectedProductId?: string;
  formError?: string;
}

export const ProductSelector = ({
  catalogProducts,
  isLoading,
  onProductSelect,
  selectedProductId,
  formError
}: ProductSelectorProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  
  // Log products data for debugging
  console.log("ProductSelector - Products data:", catalogProducts?.length, catalogProducts);
  
  // Get the currently selected product
  const selectedProduct = catalogProducts?.find(product => product.id === selectedProductId);
  
  // Open product selection dialog
  const openProductDialog = () => {
    console.log("Opening product dialog with", catalogProducts?.length, "products");
    setTouched(true);
    setDialogOpen(true);
  };

  // Handle product selection from dialog
  const handleProductSelect = (product: Product) => {
    console.log("Product selected from dialog:", product);
    onProductSelect(product.id);
  };
  
  const isInvalid = (touched && !selectedProductId) || Boolean(formError);
  const errorMessage = formError || 'Please select a product';
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Select Product <span className="text-destructive">*</span></Label>
        {isInvalid && (
          <span className="text-xs text-destructive">
            {errorMessage}
          </span>
        )}
      </div>
      <Button 
        variant={isInvalid ? "destructive" : "outline"}
        className={`w-full justify-between ${isInvalid ? 'border-destructive' : ''}`}
        onClick={openProductDialog}
        type="button"
      >
        <span>
          {selectedProduct ? (
            <>
              {selectedProduct.name} 
              {selectedProduct.bag_length && selectedProduct.bag_width && (
                <>(${selectedProduct.bag_length}" × ${selectedProduct.bag_width}")</>  
              )}
              {selectedProduct.default_quantity && selectedProduct.default_quantity > 1 && (
                <> - {selectedProduct.default_quantity} units</>  
              )}
            </>
          ) : (
            "Choose a product template"
          )}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
      
      <ProductSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={catalogProducts || []}
        onSelect={handleProductSelect}
        isLoading={isLoading}
      />
    </div>
  );
};
