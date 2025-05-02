
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { AlertCircle } from "lucide-react";
import { OrderFormData } from "@/types/order";

interface Company {
  id: string;
  name: string;
}

interface OrderDetailsFormProps {
  formData: OrderFormData;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  onProductSelect?: (components: any[]) => void;
  formErrors: {
    company?: string;
    quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  };
}

export const OrderDetailsForm = ({ 
  formData, 
  handleOrderChange, 
  onProductSelect,
  formErrors 
}: OrderDetailsFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const { data: catalogProducts, isLoading } = useCatalogProducts();

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

  const handleProductSelect = (productId: string) => {
    const selectedProduct = catalogProducts?.find(p => p.id === productId);
    if (selectedProduct) {
      // Update all product dimensions including border dimension
      handleOrderChange({ target: { name: 'bag_length', value: selectedProduct.bag_length.toString() } });
      handleOrderChange({ target: { name: 'bag_width', value: selectedProduct.bag_width.toString() } });
      if (selectedProduct.border_dimension !== undefined && selectedProduct.border_dimension !== null) {
        handleOrderChange({ target: { name: 'border_dimension', value: selectedProduct.border_dimension.toString() } });
      }
      if (selectedProduct.default_quantity) {
        handleOrderChange({ target: { name: 'quantity', value: selectedProduct.default_quantity.toString() } });
      }
      if (selectedProduct.default_rate) {
        handleOrderChange({ target: { name: 'rate', value: selectedProduct.default_rate.toString() } });
      }
      
      // Pass components to parent component if they exist
      if (onProductSelect && selectedProduct.catalog_components) {
        onProductSelect(selectedProduct.catalog_components);
      }
    }
  };

  const handleCompanySelect = (companyId: string | null) => {
    if (companyId && companyId !== "no_selection") {
      // Only set company_id, don't set company_name
      handleOrderChange({
        target: {
          name: 'company_id',
          value: companyId
        }
      });
    } else {
      // Clear company_id when no company is selected
      handleOrderChange({ target: { name: 'company_id', value: null } });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
        <CardDescription>Enter the basic information for this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product selection dropdown */}
        <div className="space-y-2">
          <Label>Select Product (Optional)</Label>
          <Select onValueChange={handleProductSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a product template" />
            </SelectTrigger>
            <SelectContent>
              {catalogProducts?.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company section */}
        <div className="space-y-4 border-b pb-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="flex items-center gap-1">
              Company Name
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="company_name" 
              name="company_name"
              value={formData.company_name}
              onChange={(e) => handleOrderChange(e)}
              placeholder="Enter company name"
              required
              autoComplete="off"
              className={formErrors.company ? "border-destructive" : ""}
            />
            {formErrors.company && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.company}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_account">Sales Account (Optional)</Label>
            <Select 
              onValueChange={(value) => 
                handleOrderChange({ 
                  target: { 
                    name: 'sales_account_id', 
                    value 
                  } 
                })
              }
              value={formData.sales_account_id || "none"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sales account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Order details section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center gap-1">
              Order Quantity
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="quantity" 
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleOrderChange}
              placeholder="Number of bags"
              required
              className={formErrors.quantity ? "border-destructive" : ""}
              min="1"
            />
            {formErrors.quantity && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.quantity}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order_date" className="flex items-center gap-1">
              Order Date
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="order_date"
              name="order_date"
              type="date"
              value={formData.order_date}
              onChange={handleOrderChange}
              required
              className={formErrors.order_date ? "border-destructive" : ""}
            />
            {formErrors.order_date && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.order_date}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bag_length" className="flex items-center gap-1">
              Bag Length (inches)
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="bag_length" 
              name="bag_length"
              type="number"
              step="0.01"
              value={formData.bag_length}
              onChange={handleOrderChange}
              placeholder="Length in inches"
              required
              className={formErrors.bag_length ? "border-destructive" : ""}
              min="0"
            />
            {formErrors.bag_length && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.bag_length}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bag_width" className="flex items-center gap-1">
              Bag Width (inches)
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="bag_width" 
              name="bag_width"
              type="number"
              step="0.01"
              value={formData.bag_width}
              onChange={handleOrderChange}
              placeholder="Width in inches"
              required
              className={formErrors.bag_width ? "border-destructive" : ""}
              min="0"
            />
            {formErrors.bag_width && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.bag_width}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="border_dimension">
              Border Dimension / Height (inches)
            </Label>
            <Input 
              id="border_dimension" 
              name="border_dimension"
              type="number"
              step="0.01"
              value={formData.border_dimension || ""}
              onChange={handleOrderChange}
              placeholder="Height in inches"
              min="0"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rate">Rate per Bag</Label>
            <Input 
              id="rate" 
              name="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={handleOrderChange}
              placeholder="Price per bag"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="special_instructions">Special Instructions (optional)</Label>
            <Textarea 
              id="special_instructions" 
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleOrderChange}
              placeholder="Any additional notes or requirements"
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
