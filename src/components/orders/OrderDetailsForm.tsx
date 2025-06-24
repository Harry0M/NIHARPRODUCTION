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
  onProductSelect?: (components: unknown[]) => void;
  formErrors: {
    company?: string;
    quantity?: string;
    product_quantity?: string;
    total_quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
    product_id?: string;
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
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(formData.catalog_id || undefined);

  // Set initial product ID from form data if it exists
  useEffect(() => {
    console.log("OrderDetailsForm - formData.catalog_id:", formData.catalog_id, "selectedProductId:", selectedProductId);
    if (formData.catalog_id && formData.catalog_id !== selectedProductId) {
      console.log("OrderDetailsForm - Setting selectedProductId to:", formData.catalog_id);
      setSelectedProductId(formData.catalog_id);
    }
  }, [formData.catalog_id, selectedProductId]);

  // Fetch companies with caching to improve performance
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        console.log('Starting companies fetch process...');
        // Try to get companies from localStorage first
        const cachedData = localStorage.getItem('companiesCache');
        let cachedCompanies = null;
        let shouldFetch = true;
        
        if (cachedData) {
          try {
            const cache = JSON.parse(cachedData);
            cachedCompanies = cache.companies;
            const cacheTimestamp = cache.timestamp;
            const cacheCount = cache.count || 0;
            
            // Set companies from cache immediately for fast UI rendering
            if (Array.isArray(cachedCompanies) && cachedCompanies.length > 0) {
              console.log('Setting companies from cache:', cachedCompanies.length);
              setCompanies(cachedCompanies);
              
              // Check if cache is still valid (less than 24 hours old)
              const cacheAge = Date.now() - cacheTimestamp;
              const oneDayInMs = 24 * 60 * 60 * 1000;
              
              if (cacheAge < oneDayInMs) {
                // Cache is fresh enough, but still check counts to ensure data integrity
                // Just fetch the count to see if we need to update the cache
                const { count, error: countError } = await supabase
                  .from('companies')
                  .select('id', { count: 'exact', head: true })
                  .eq('status', 'active');
                
                if (!countError && count !== null && count === cacheCount) {
                  // The count matches, so we can use the cached data
                  shouldFetch = false;
                  console.log('Using cached companies data - count matches:', count);
                } else {
                  console.log('Cache count mismatch. DB count:', count, 'Cache count:', cacheCount);
                }
              } else {
                console.log('Cache is too old, fetching fresh data');
              }
            } else {
              console.log('Cached companies invalid or empty');
            }
          } catch (e) {
            console.error('Error parsing cached companies:', e);
            // Cache is invalid, will fetch fresh data
          }
        } else {
          console.log('No companies cache found');
        }
        
        if (shouldFetch) {
          console.log('Fetching fresh companies data from database...');
          const { data, error, count } = await supabase
            .from('companies')
            .select('id, name', { count: 'exact' })
            .eq('status', 'active');

          if (!error && data) {
            console.log('Successfully fetched companies from DB:', data.length);
            setCompanies(data);
            
            // Update the cache with fresh data
            localStorage.setItem('companiesCache', JSON.stringify({
              companies: data,
              timestamp: Date.now(),
              count: count || data.length
            }));
            
            console.log(`Cached ${data.length} companies`);
          } else if (error) {
            console.error('Error fetching companies:', error);
          }
        }
      } catch (error) {
        console.error('Exception in fetchCompanies:', error);
      }
    };

    fetchCompanies();
  }, []);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    // Update the catalog_id in the form data when a product is selected
    handleOrderChange({ target: { name: 'catalog_id', value: productId } });
    
    // Clear any existing product_id error when a product is selected
    if (formErrors.product_id) {
      handleOrderChange({ target: { name: 'product_id', value: '' } });
    }
    
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
        
        console.log("DEBUG - Component types for product:", selectedProduct.catalog_components.map(c => ({
          type: c.component_type,
          lowercase_type: c.component_type?.toLowerCase(),
          id: c.id
        })));

        console.log("DEBUG - Components for product with quantity:", componentsWithQuantity);
        
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
        {/* Company Section Component */}
        <CompanySection 
          formData={formData}
          companies={companies}
          handleOrderChange={handleOrderChange}
          formErrors={formErrors}
        />
        
        {/* Product Selector Component */}
        <ProductSelector 
          catalogProducts={catalogProducts}
          isLoading={isLoading}
          onProductSelect={handleProductSelect}
          selectedProductId={selectedProductId}
          formError={formErrors.product_id}
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
