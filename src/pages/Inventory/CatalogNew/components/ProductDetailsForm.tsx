
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductDetailsFormProps {
  productData: {
    name: string;
    description: string;
    bag_length: string;
    bag_width: string;
    border_dimension: string;
    default_quantity: string;
    default_rate: string;
  };
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ProductDetailsForm: React.FC<ProductDetailsFormProps> = ({ productData, handleProductChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Enter the basic information for this product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="name" 
            name="name"
            value={productData.name}
            onChange={handleProductChange}
            placeholder="Enter product name"
            required
          />
          <p className="text-xs text-muted-foreground">
            Product name without quantity (e.g., "Test Bag"). Quantity will be automatically appended if provided below.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            name="description"
            value={productData.description}
            onChange={handleProductChange}
            placeholder="Enter product description"
            rows={3}
          />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bag_length">
              Bag Length (inches) <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="bag_length" 
              name="bag_length"
              type="number"
              step="0.01"
              value={productData.bag_length}
              onChange={handleProductChange}
              placeholder="Length in inches"
              required
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bag_width">
              Bag Width (inches) <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="bag_width" 
              name="bag_width"
              type="number"
              step="0.01"
              value={productData.bag_width}
              onChange={handleProductChange}
              placeholder="Width in inches"
              required
              min="0"
            />
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
              value={productData.border_dimension}
              onChange={handleProductChange}
              placeholder="Height/Border dimension in inches"
              min="0"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_quantity">Default Quantity</Label>
            <Input 
              id="default_quantity" 
              name="default_quantity"
              type="number"
              value={productData.default_quantity}
              onChange={handleProductChange}
              placeholder="Default order quantity"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Will be shown in product name as "Product Name*Quantity"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductDetailsForm;
