import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
  // Removed unused props since editing is disabled
}

export function OrderInfoEditForm({
  order
}: OrderInfoEditFormProps) {
  // Editing functionality removed - always show read-only view
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Information</CardTitle>
        {/* Edit button removed - no editing allowed */}
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
          {/* Quantity field removed - only showing Order Quantity */}
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
