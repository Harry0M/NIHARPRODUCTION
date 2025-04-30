
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductDetails } from "./types";

interface ProductDetailsFormProps {
  productDetails: ProductDetails;
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ProductDetailsForm = ({ productDetails, handleProductChange }: ProductDetailsFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>
          Enter the basic information for this product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter product name"
              value={productDetails.name}
              onChange={handleProductChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter product description"
              value={productDetails.description}
              onChange={handleProductChange}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bag_length">Bag Length (inches) *</Label>
              <Input
                id="bag_length"
                name="bag_length"
                type="number"
                step="0.01"
                placeholder="Enter length"
                value={productDetails.bag_length}
                onChange={handleProductChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bag_width">Bag Width (inches) *</Label>
              <Input
                id="bag_width"
                name="bag_width"
                type="number"
                step="0.01"
                placeholder="Enter width"
                value={productDetails.bag_width}
                onChange={handleProductChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="default_quantity">Default Quantity</Label>
              <Input
                id="default_quantity"
                name="default_quantity"
                type="number"
                placeholder="Enter default quantity"
                value={productDetails.default_quantity}
                onChange={handleProductChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="default_rate">Default Rate (₹)</Label>
              <Input
                id="default_rate"
                name="default_rate"
                type="number"
                step="0.01"
                placeholder="Enter default rate"
                value={productDetails.default_rate}
                onChange={handleProductChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
