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

interface Company {
  id: string;
  name: string;
}

interface OrderDetailsFormProps {
  formData: {
    company_name: string;
    company_id?: string;
    quantity: string;
    bag_length: string;
    bag_width: string;
    rate: string;
    special_instructions: string;
    order_date?: string;
  };
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string } 
  }) => void;
  onProductSelect?: (components: any[]) => void;
}

export const OrderDetailsForm = ({ formData, handleOrderChange, onProductSelect }: OrderDetailsFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const { data: catalogProducts, isLoading } = useCatalogProducts();

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name');

      if (!error && data) {
        setCompanies(data);
      }
    };

    fetchCompanies();
  }, []);

  const handleProductSelect = (productId: string) => {
    const selectedProduct = catalogProducts?.find(p => p.id === productId);
    if (selectedProduct) {
      // Update form fields
      handleOrderChange({ target: { name: 'bag_length', value: selectedProduct.bag_length.toString() } });
      handleOrderChange({ target: { name: 'bag_width', value: selectedProduct.bag_width.toString() } });
      if (selectedProduct.default_quantity) {
        handleOrderChange({ target: { name: 'quantity', value: selectedProduct.default_quantity.toString() } });
      }
      if (selectedProduct.default_rate) {
        handleOrderChange({ target: { name: 'rate', value: selectedProduct.default_rate.toString() } });
      }
      
      // Pass components to parent component
      if (onProductSelect && selectedProduct.catalog_components) {
        onProductSelect(selectedProduct.catalog_components);
      }
    }
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId) {
      const selectedCompany = companies.find(c => c.id === companyId);
      
      if (selectedCompany) {
        handleOrderChange({
          target: {
            name: 'company_id',
            value: selectedCompany.id
          }
        });
        
        handleOrderChange({
          target: {
            name: 'company_name',
            value: selectedCompany.name
          }
        });
      }
    } else {
      // Clear both fields when no company is selected
      handleOrderChange({ target: { name: 'company_id', value: '' } });
      handleOrderChange({ target: { name: 'company_name', value: '' } });
    }
  };

  // Handle manual company name input
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleOrderChange(e);
    // Clear company_id when manually entering a name
    if (e.target.value) {
      handleOrderChange({
        target: {
          name: 'company_id',
          value: ''
        }
      });
    }
  };

  // Compute if the form is in a valid state for company selection
  const isUsingExistingCompany = !!formData.company_id;
  const isUsingNewCompany = !!formData.company_name && !formData.company_id;

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

        {/* Company selection section */}
        <div className="space-y-4 border-b pb-4">
          <div className="space-y-2">
            <Label htmlFor="company_select">
              Select Existing Company
            </Label>
            <Select 
              value={formData.company_id || ""} 
              onValueChange={handleCompanySelect}
            >
              <SelectTrigger id="company_select">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name" className="flex items-center gap-1">
              Company Name
              <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="company_name" 
              name="company_name"
              value={formData.company_name}
              onChange={handleCompanyNameChange}
              placeholder="Enter company name"
              required
              className={!formData.company_name ? "border-destructive" : ""}
            />
            {!formData.company_name && (
              <p className="text-xs text-destructive">Company name is required</p>
            )}
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
              className={!formData.quantity ? "border-destructive" : ""}
              min="1"
            />
            {!formData.quantity && (
              <p className="text-xs text-destructive">Quantity is required</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order_date">Order Date</Label>
            <Input 
              id="order_date"
              name="order_date"
              type="date"
              value={formData.order_date}
              onChange={handleOrderChange}
              required
            />
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
              className={!formData.bag_length ? "border-destructive" : ""}
              min="0"
            />
            {!formData.bag_length && (
              <p className="text-xs text-destructive">Length is required</p>
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
              className={!formData.bag_width ? "border-destructive" : ""}
              min="0"
            />
            {!formData.bag_width && (
              <p className="text-xs text-destructive">Width is required</p>
            )}
          </div>
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
      </CardContent>
    </Card>
  );
};
