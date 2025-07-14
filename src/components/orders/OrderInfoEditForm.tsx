import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CalendarIcon, Pencil, Save, X } from "lucide-react";
import { OrderFormData } from "@/types/order";

interface Company {
  id: string;
  name: string;
}

interface OrderInfoEditFormProps {
  order: {
    id: string;
    order_number: string;
    company_name: string;
    company_id?: string | null;
    quantity: string | number;
    order_quantity?: string | number;
    bag_length: number;
    bag_width: number;
    border_dimension?: number | null;
    order_date: string;
    delivery_date?: string | null;
    sales_account_id?: string | null;
    catalog_id?: string | null;
    special_instructions?: string | null;
  };
  companies: Company[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: (data: Partial<OrderFormData>) => Promise<boolean>;
  loading?: boolean;
}

export function OrderInfoEditForm({
  order,
  companies,
  isEditing,
  onToggleEdit,
  onSave,
  loading = false
}: OrderInfoEditFormProps) {
  const [formData, setFormData] = useState<Partial<OrderFormData>>({});

  // Initialize form data when editing starts
  useEffect(() => {
    if (isEditing) {
      setFormData({
        company_name: order.company_name,
        company_id: order.company_id || undefined,
        quantity: String(order.quantity || ''),
        order_quantity: String(order.order_quantity || ''),
        bag_length: String(order.bag_length || ''),
        bag_width: String(order.bag_width || ''),
        border_dimension: order.border_dimension ? String(order.border_dimension) : '',
        order_date: order.order_date,
        delivery_date: order.delivery_date || '',
        sales_account_id: order.sales_account_id || undefined,
        catalog_id: order.catalog_id || undefined,
        special_instructions: order.special_instructions || ''
      });
    }
  }, [isEditing, order]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === 'none' ? null : value
    }));
  };

  const handleSave = async () => {
    const success = await onSave(formData);
    if (success) {
      onToggleEdit();
    }
  };

  const handleCancel = () => {
    setFormData({});
    onToggleEdit();
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Information</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
            disabled={loading}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Number</Label>
              <p className="text-sm">{order.order_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Company</Label>
              <p className="text-sm">{order.company_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Quantity</Label>
              <p className="text-sm">{order.quantity}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Quantity</Label>
              <p className="text-sm">{order.order_quantity || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Bag Dimensions</Label>
              <p className="text-sm">{order.bag_length} × {order.bag_width}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Border Dimension</Label>
              <p className="text-sm">{order.border_dimension || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Date</Label>
              <p className="text-sm">{new Date(order.order_date).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
              <p className="text-sm">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}</p>
            </div>
          </div>
          {order.special_instructions && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Special Instructions</Label>
              <p className="text-sm">{order.special_instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Order Information</CardTitle>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name || ''}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <Label htmlFor="sales_account_id">Sales Account</Label>
            <Select 
              value={formData.sales_account_id || 'none'} 
              onValueChange={(value) => handleSelectChange('sales_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company selected</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">Total Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder="Enter total quantity"
            />
          </div>
          <div>
            <Label htmlFor="order_quantity">Order Quantity</Label>
            <Input
              id="order_quantity"
              type="number"
              value={formData.order_quantity || ''}
              onChange={(e) => handleInputChange('order_quantity', e.target.value)}
              placeholder="Enter order quantity"
            />
          </div>
          <div>
            <Label htmlFor="bag_length">Bag Length</Label>
            <Input
              id="bag_length"
              type="number"
              step="0.01"
              value={formData.bag_length || ''}
              onChange={(e) => handleInputChange('bag_length', e.target.value)}
              placeholder="Enter bag length"
            />
          </div>
          <div>
            <Label htmlFor="bag_width">Bag Width</Label>
            <Input
              id="bag_width"
              type="number"
              step="0.01"
              value={formData.bag_width || ''}
              onChange={(e) => handleInputChange('bag_width', e.target.value)}
              placeholder="Enter bag width"
            />
          </div>
          <div>
            <Label htmlFor="border_dimension">Border Dimension</Label>
            <Input
              id="border_dimension"
              type="number"
              step="0.01"
              value={formData.border_dimension || ''}
              onChange={(e) => handleInputChange('border_dimension', e.target.value)}
              placeholder="Enter border dimension"
            />
          </div>
          <div>
            <Label htmlFor="order_date">Order Date</Label>
            <Input
              id="order_date"
              type="date"
              value={formData.order_date || ''}
              onChange={(e) => handleInputChange('order_date', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="delivery_date">Delivery Date</Label>
            <Input
              id="delivery_date"
              type="date"
              value={formData.delivery_date || ''}
              onChange={(e) => handleInputChange('delivery_date', e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="special_instructions">Special Instructions</Label>
          <Textarea
            id="special_instructions"
            value={formData.special_instructions || ''}
            onChange={(e) => handleInputChange('special_instructions', e.target.value)}
            placeholder="Enter any special instructions"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
