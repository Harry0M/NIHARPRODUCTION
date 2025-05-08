
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { OrderFormData } from "@/types/order";

// Import component sections
import { ProductSelector } from "./form-sections/ProductSelector";
import { CompanySection } from "./form-sections/CompanySection";
import { OrderDetailsSection } from "./form-sections/OrderDetailsSection";
import { BagDimensionsSection } from "./form-sections/BagDimensionsSection";
import { AdditionalDetailsSection } from "./form-sections/AdditionalDetailsSection";

interface OrderDetailsFormProps {
  formData: OrderFormData;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  onProductSelect?: (components: any[]) => void;
  formErrors: {
    company?: string;
    quantity?: string;
    product_quantity?: string;
    total_quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  };
  updateConsumptionBasedOnQuantity?: (quantity: number) => void;
  productPopulatedFields?: boolean;
}

export const OrderDetailsForm = ({ 
  formData, 
  handleOrderChange, 
  onProductSelect,
  formErrors,
  updateConsumptionBasedOnQuantity,
  productPopulatedFields = false
}: OrderDetailsFormProps) => {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const { data: catalogProducts, isLoading } = useCatalogProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('status', 'active');

      if (!error && data) {
        setCompanies(data);
      }
    };

    fetchCompanies();
  }, []);

  const handleProductSelect = async (productId: string) => {
    setSelectedProductId(productId);
    const selectedProduct = catalogProducts?.find(p => p.id === productId);
    
    if (selectedProduct) {
      console.log("Selected product:", selectedProduct);
      
      // Update all product dimensions including border dimension
      handleOrderChange({ target: { name: 'bag_length', value: selectedProduct.bag_length?.toString() } });
      handleOrderChange({ target: { name: 'bag_width', value: selectedProduct.bag_width?.toString() } });
      
      if (selectedProduct.border_dimension !== undefined && selectedProduct.border_dimension !== null) {
        handleOrderChange({ target: { name: 'border_dimension', value: selectedProduct.border_dimension.toString() } });
      }
      
      // Set product_quantity from default_quantity if available
      if (selectedProduct.default_quantity) {
        handleOrderChange({ 
          target: { 
            name: 'product_quantity', 
            value: selectedProduct.default_quantity.toString() 
          } 
        });
        
        // If order quantity is already set, update total_quantity
        if (formData.quantity) {
          const orderQty = parseFloat(formData.quantity);
          const productQty = parseFloat(selectedProduct.default_quantity.toString());
          
          if (!isNaN(orderQty) && !isNaN(productQty)) {
            handleOrderChange({ 
              target: { 
                name: 'total_quantity', 
                value: (orderQty * productQty).toString() 
              } 
            });
          }
        }
      } else {
        // Default to 1 if not specified
        handleOrderChange({ target: { name: 'product_quantity', value: "1" } });
      }
      
      // Only set rate from the product if available
      if (selectedProduct.default_rate) {
        handleOrderChange({ target: { name: 'rate', value: selectedProduct.default_rate.toString() } });
      }
      
      // Pass components to parent component with complete material data
      if (onProductSelect && selectedProduct.catalog_components && selectedProduct.catalog_components.length > 0) {
        // Add default_quantity to each component for reference
        const componentsWithQuantity = selectedProduct.catalog_components.map(component => ({
          ...component,
          default_quantity: selectedProduct.default_quantity || 1
        }));
        
        console.log("Passing components with material data and default quantity:", componentsWithQuantity);
        onProductSelect(componentsWithQuantity);
        
        // If quantity is already set, update consumption values based on total quantity
        if (formData.quantity && updateConsumptionBasedOnQuantity) {
          const quantity = parseFloat(formData.quantity);
          const productQty = selectedProduct.default_quantity || 1;
          
          if (!isNaN(quantity) && quantity > 0) {
            setTimeout(() => updateConsumptionBasedOnQuantity(quantity * productQty), 100);
          }
        }
      } else {
        console.log("No components found in the selected product");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
        <CardDescription>Enter the basic information for this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Selector Component */}
        <ProductSelector 
          catalogProducts={catalogProducts}
          isLoading={isLoading}
          onProductSelect={handleProductSelect}
          selectedProductId={selectedProductId}
        />

        {/* Company Section Component */}
        <CompanySection 
          formData={formData}
          companies={companies}
          handleOrderChange={handleOrderChange}
          formErrors={formErrors}
        />

        {/* Order Details Section Component */}
        <OrderDetailsSection 
          formData={formData}
          handleOrderChange={handleOrderChange}
          formErrors={formErrors}
          updateConsumptionBasedOnQuantity={updateConsumptionBasedOnQuantity}
        />

        {/* Bag Dimensions Section Component */}
        <BagDimensionsSection 
          formData={formData}
          handleOrderChange={handleOrderChange}
          formErrors={formErrors}
          readOnly={productPopulatedFields}
        />

        {/* Additional Details Section Component */}
        <AdditionalDetailsSection 
          formData={formData}
          handleOrderChange={handleOrderChange}
          readOnly={productPopulatedFields}
        />
      </CardContent>
    </Card>
  );
};
