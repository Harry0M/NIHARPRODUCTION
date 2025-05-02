
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductInfoCardProps {
  name: string;
  bagLength: number;
  bagWidth: number;
  borderDimension: number | null;
  defaultQuantity: number | null;
  defaultRate: number | null;
  createdAt: string;
}

export const ProductInfoCard = ({
  name,
  bagLength,
  bagWidth,
  borderDimension,
  defaultQuantity,
  defaultRate,
  createdAt,
}: ProductInfoCardProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Product Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Size (L×W)</p>
            <p className="font-medium">{bagLength} × {bagWidth} inches</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Border Dimension</p>
            <p className="font-medium">{borderDimension || 'N/A'} inches</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Default Quantity</p>
            <p className="font-medium">{defaultQuantity || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Default Rate</p>
            <p className="font-medium">{defaultRate ? `₹${defaultRate}` : 'N/A'}</p>
          </div>
          <div className="col-span-2 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created On</p>
            <p className="font-medium">{new Date(createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
