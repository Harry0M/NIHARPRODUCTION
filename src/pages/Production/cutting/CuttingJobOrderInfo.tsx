
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CuttingJobOrderInfoProps {
  order: {
    order_number: string;
    company_name: string;
    quantity: number;
    bag_length: number;
    bag_width: number;
  };
}

export function CuttingJobOrderInfo({ order }: CuttingJobOrderInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Information</CardTitle>
        <CardDescription>Order details for this job</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
            <p className="text-lg">{order.order_number}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
            <p className="text-lg">{order.company_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
            <p className="text-lg">{order.quantity.toLocaleString()} bags</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Bag Size</h3>
            <p className="text-lg">{order.bag_length} × {order.bag_width} inches</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
