
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

interface OrderDetailsFormProps {
  formData: {
    company_name: string;
    quantity: string;
    bag_length: string;
    bag_width: string;
    rate: string;
    special_instructions: string;
  };
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const OrderDetailsForm = ({ formData, handleOrderChange }: OrderDetailsFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
        <CardDescription>Enter the basic information for this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input 
              id="company_name" 
              name="company_name"
              value={formData.company_name}
              onChange={handleOrderChange}
              placeholder="Client company name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Order Quantity</Label>
            <Input 
              id="quantity" 
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleOrderChange}
              placeholder="Number of bags"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bag_length">Bag Length (inches)</Label>
            <Input 
              id="bag_length" 
              name="bag_length"
              type="number"
              step="0.01"
              value={formData.bag_length}
              onChange={handleOrderChange}
              placeholder="Length in inches"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bag_width">Bag Width (inches)</Label>
            <Input 
              id="bag_width" 
              name="bag_width"
              type="number"
              step="0.01"
              value={formData.bag_width}
              onChange={handleOrderChange}
              placeholder="Width in inches"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Rate per Bag (optional)</Label>
            <Input 
              id="rate" 
              name="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={handleOrderChange}
              placeholder="Price per bag"
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
