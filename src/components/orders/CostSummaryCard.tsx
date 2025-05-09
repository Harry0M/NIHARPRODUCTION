
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { OrderFormData } from "@/types/order";

interface CostSummaryCardProps {
  costData: {
    materialCost: number;
    productionCost: number;
    totalCost: number;
    sellingPrice: number;
    margin: number | null;
  };
  orderDetails: OrderFormData;
  onMarginChange?: (margin: string) => void;
  readOnly?: boolean;
}

export function CostSummaryCard({
  costData,
  orderDetails,
  onMarginChange,
  readOnly = false
}: CostSummaryCardProps) {
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onMarginChange) {
      onMarginChange(e.target.value);
    }
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
        <CardDescription>Breakdown of costs and pricing for this order</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Material Cost</Label>
              <p className="font-medium">{formatCurrency(costData.materialCost)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Production Cost</Label>
              <p className="font-medium">{formatCurrency(costData.productionCost)}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Total Cost</Label>
              <p className="font-medium text-lg">{formatCurrency(costData.totalCost)}</p>
            </div>
            <div>
              <Label htmlFor="margin" className="text-muted-foreground flex items-center gap-1">
                Margin (%)
                {orderDetails.template_margin && (
                  <InfoCircledIcon className="h-4 w-4 text-blue-500" title={`Template margin: ${orderDetails.template_margin}%`} />
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="margin" 
                  name="margin"
                  type="number"
                  value={orderDetails.margin || ''}
                  onChange={handleMarginChange}
                  className={`w-20 ${orderDetails.template_margin ? 'border-blue-200' : ''}`}
                  readOnly={readOnly}
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <Label className="text-blue-800">Calculated Selling Price</Label>
            <p className="font-medium text-lg text-blue-900">{formatCurrency(costData.sellingPrice)}</p>
            <p className="text-sm text-blue-700 mt-1">Per unit rate: {formatCurrency(costData.sellingPrice / (parseFloat(orderDetails.quantity) || 1))}</p>
          </div>
          
          {orderDetails.rate && parseFloat(orderDetails.rate) > 0 && (
            <div className={`p-4 rounded-md ${
              parseFloat(orderDetails.rate) < costData.sellingPrice 
                ? 'bg-red-50 text-red-800' 
                : 'bg-green-50 text-green-800'
            }`}>
              <Label>Current Order Rate: {formatCurrency(parseFloat(orderDetails.rate))}</Label>
              {parseFloat(orderDetails.rate) < costData.sellingPrice && (
                <p className="text-sm mt-1">
                  Warning: Order rate is lower than the calculated selling price by {formatCurrency(costData.sellingPrice - parseFloat(orderDetails.rate))}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
