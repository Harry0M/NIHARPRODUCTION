
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductInfoCardProps {
  name: string;
  bagLength: number;
  bagWidth: number;
  borderDimension: number | null;
  defaultQuantity: number | null;
  defaultRate: number | null;
  createdAt: string;
  sellingRate?: number | null;
  totalCost?: number | null;
  margin?: number | null;
  description?: string | null;
  // Add new cost fields
  cuttingCharge?: number | null;
  printingCharge?: number | null;
  stitchingCharge?: number | null;
  transportCharge?: number | null;
}

export const ProductInfoCard = ({
  name,
  bagLength,
  bagWidth,
  borderDimension,
  defaultQuantity,
  defaultRate,
  createdAt,
  sellingRate,
  totalCost,
  margin,
  description,
  cuttingCharge,
  printingCharge, 
  stitchingCharge,
  transportCharge,
}: ProductInfoCardProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Product Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Basic Information */}
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

          {/* Cost Information */}
          <div className="col-span-2">
            <h3 className="font-medium mb-2 border-b pb-1">Cost Information</h3>
          </div>
          
          {cuttingCharge !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Cutting Charge</p>
              <p className="font-medium">{cuttingCharge ? `₹${cuttingCharge}` : 'N/A'}</p>
            </div>
          )}
          
          {printingCharge !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Printing Charge</p>
              <p className="font-medium">{printingCharge ? `₹${printingCharge}` : 'N/A'}</p>
            </div>
          )}
          
          {stitchingCharge !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Stitching Charge</p>
              <p className="font-medium">{stitchingCharge ? `₹${stitchingCharge}` : 'N/A'}</p>
            </div>
          )}
          
          {transportCharge !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Transport Charge</p>
              <p className="font-medium">{transportCharge ? `₹${transportCharge}` : 'N/A'}</p>
            </div>
          )}
          
          {totalCost !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="font-medium">{totalCost ? `₹${totalCost}` : 'N/A'}</p>
            </div>
          )}

          {/* Pricing Information */}
          <div className="col-span-2">
            <h3 className="font-medium mb-2 border-b pb-1">Pricing Information</h3>
          </div>
          
          {sellingRate !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Selling Rate</p>
              <p className="font-medium">{sellingRate ? `₹${sellingRate}` : 'N/A'}</p>
            </div>
          )}
          
          {margin !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Margin</p>
              <p className="font-medium">{margin ? `${margin}%` : 'N/A'}</p>
            </div>
          )}
          
          <div className="col-span-2 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created On</p>
            <p className="font-medium">{new Date(createdAt).toLocaleDateString()}</p>
          </div>
          
          {description && (
            <div className="col-span-2 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="font-medium">{description}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
