
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  // Cost breakdown fields
  materialCost?: number | null;
  cuttingCharge?: number | null;
  printingCharge?: number | null;
  stitchingCharge?: number | null;
  transportCharge?: number | null;
  productionCost?: number | null;
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
  materialCost,
  cuttingCharge,
  printingCharge, 
  stitchingCharge,
  transportCharge,
  productionCost,
}: ProductInfoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Calculate profit if we have the necessary values
  const profit = sellingRate && totalCost ? sellingRate - totalCost : null;
  const profitIsPositive = profit !== null && profit > 0;
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Product Information</span>
          {(materialCost !== undefined || cuttingCharge !== undefined || printingCharge !== undefined || 
            stitchingCharge !== undefined || transportCharge !== undefined) && (
            <button 
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide Cost Details' : 'Show Cost Details'}
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
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
            <p className="font-medium">{formatCurrency(defaultRate)}</p>
          </div>
        </div>

        {/* Cost Breakdown Section */}
        <div className="col-span-2">
          <h3 className="font-medium mb-2 border-b pb-1">Cost Breakdown</h3>
        </div>
        
        {/* Detailed cost breakdown with expand/collapse */}
        {isExpanded ? (
          <div className="space-y-4">
            {/* Material Cost Section */}
            {materialCost !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Material Costs</h3>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span>Material Cost</span>
                    <span className="font-medium">{formatCurrency(materialCost)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Production Costs Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Production Costs</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {cuttingCharge !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span>Cutting</span>
                        <span>{formatCurrency(cuttingCharge)}</span>
                      </div>
                    </div>
                  )}
                  {printingCharge !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span>Printing</span>
                        <span>{formatCurrency(printingCharge)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {stitchingCharge !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span>Stitching</span>
                        <span>{formatCurrency(stitchingCharge)}</span>
                      </div>
                    </div>
                  )}
                  {transportCharge !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span>Transport</span>
                        <span>{formatCurrency(transportCharge)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {productionCost !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Production Cost</span>
                      <span>{formatCurrency(productionCost)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Total Cost Section */}
            {totalCost !== undefined && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Cost</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
            )}
            
            {/* Pricing Information */}
            {margin !== undefined && (
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span>Profit Margin</span>
                  <span>{margin}%</span>
                </div>
              </div>
            )}
            
            {sellingRate !== undefined && (
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span>Selling Price</span>
                  <span className="font-medium">{formatCurrency(sellingRate)}</span>
                </div>
              </div>
            )}
            
            {/* Profit Display */}
            {profit !== null && (
              <div className={`p-3 rounded-md ${profitIsPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center font-medium">
                  <span>Profit</span>
                  <span className={profitIsPositive ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Collapsed view of cost information */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {materialCost !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Material Cost</p>
                  <p className="font-medium">{formatCurrency(materialCost)}</p>
                </div>
              )}
              {productionCost !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Production Cost</p>
                  <p className="font-medium">{formatCurrency(productionCost)}</p>
                </div>
              )}
              {totalCost !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="font-medium">{formatCurrency(totalCost)}</p>
                </div>
              )}
              {margin !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Margin</p>
                  <p className="font-medium">{margin}%</p>
                </div>
              )}
              {sellingRate !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Selling Price</p>
                  <p className="font-medium text-green-700">{formatCurrency(sellingRate)}</p>
                </div>
              )}
              {profit !== null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profit</p>
                  <p className={`font-medium ${profitIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <Separator />
        
        {/* Additional Information */}
        <div className="grid grid-cols-2 gap-4">
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
