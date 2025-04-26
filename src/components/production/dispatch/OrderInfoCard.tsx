
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderInfoCardProps {
  orderNumber: string;
  companyName: string;
  quantity: number;
  bagLength: number;
  bagWidth: number;
  status: string;
  createdAt: string;
}

export const OrderInfoCard = ({
  orderNumber,
  companyName,
  quantity,
  bagLength,
  bagWidth,
  status,
  createdAt
}: OrderInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Information</CardTitle>
        <CardDescription>
          <span>Order #{orderNumber}&nbsp;•&nbsp;</span>
          <span>{companyName}&nbsp;•&nbsp;</span>
          <span>Quantity:&nbsp;{quantity}&nbsp;bags</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div><strong>Bag Size:</strong> {bagLength} x {bagWidth} in</div>
          <div><strong>Status:</strong> {status?.replace(/_/g, " ")}</div>
          <div><strong>Created:</strong> {new Date(createdAt).toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  );
};
