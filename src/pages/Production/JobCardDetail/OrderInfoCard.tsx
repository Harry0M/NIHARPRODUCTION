
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Component } from "@/types/order";

interface Order {
  order_number: string;
  company_name: string;
  bag_length: number;
  bag_width: number;
  order_date: string;
  quantity: number;
  status: string;
  components: Component[];
}

type BadgeFn = (status: string) => React.ReactNode;
type FormatDateFn = (d: string) => string;

interface OrderInfoCardProps {
  order: Order;
  formatDate: FormatDateFn;
  getStatusBadge: BadgeFn;
}

export const OrderInfoCard = ({
  order,
  formatDate,
  getStatusBadge,
}: OrderInfoCardProps) => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <File size={18} />
        Order Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Order Number</p>
          <p>{order.order_number}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Company</p>
          <p>{order.company_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Order Date</p>
          <p>{formatDate(order.order_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Quantity</p>
          <p>{order.quantity.toLocaleString()} bags</p>
        </div>
        <div>
          <p className="text-sm font-medium">Bag Size</p>
          <p>{order.bag_length}" × {order.bag_width}"</p>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <p>{getStatusBadge(order.status)}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div>
        <h3 className="text-md font-medium mb-2">Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {order.components?.length > 0 ? (
            order.components.map((component) => (
              <div key={component.id} className="border rounded-md p-3">
                <p className="text-sm font-medium capitalize">
                  {component.component_type === 'custom' && component.custom_name 
                    ? component.custom_name 
                    : component.component_type}
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mt-1">
                  {component.size && <p>Size: {component.size}</p>}
                  {component.color && <p>Color: {component.color}</p>}
                  {component.gsm && <p>GSM: {component.gsm}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No components specified</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);
