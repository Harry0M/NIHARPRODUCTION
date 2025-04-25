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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCompanySelect?: (companyId: string | null) => void;
}

export const OrderDetailsForm = ({ formData, handleOrderChange, onCompanySelect }: OrderDetailsFormProps) => {
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
        <CardDescription>Enter the basic information for this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={formData.company_id || ""}
              onValueChange={(value) => {
                if (onCompanySelect) {
                  onCompanySelect(value || null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Enter manually</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.company_id && (
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleOrderChange}
                placeholder="Enter company name"
                className="mt-2"
              />
            )}
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
            <Label htmlFor="rate">Rate per Bag</Label>
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

        {formData.order_date !== undefined && (
          <div className="space-y-2">
            <Label htmlFor="order_date">Order Date</Label>
            <Input 
              id="order_date"
              name="order_date"
              type="date"
              value={formData.order_date}
              onChange={handleOrderChange}
              placeholder="Order date"
              required
            />
          </div>
        )}

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
