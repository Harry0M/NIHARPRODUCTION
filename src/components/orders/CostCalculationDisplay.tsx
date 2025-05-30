import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface CostCalculationDisplayProps {
  costCalculation: {
    materialCost: number;
    cuttingCharge: number;
    printingCharge: number;
    stitchingCharge: number;
    transportCharge: number;
    productionCost: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
    perUnitCost?: number;
    perUnitMaterialCost?: number;
    perUnitProductionCost?: number;
  };
  onMarginChange?: (margin: number) => void;
  onCostChange?: (type: string, value: number) => void;
  orderQuantity?: number;
}

export const CostCalculationDisplay = ({
  costCalculation,
  onMarginChange,
  onCostChange,
  orderQuantity = 1
}: CostCalculationDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Make sure we always update state when the props change
  useEffect(() => {
    setEditableCosts({
      materialCost: costCalculation.materialCost,
      cuttingCharge: costCalculation.cuttingCharge,
      printingCharge: costCalculation.printingCharge,
      stitchingCharge: costCalculation.stitchingCharge,
      transportCharge: costCalculation.transportCharge,
      productionCost: costCalculation.productionCost,
      totalCost: costCalculation.totalCost,
      margin: costCalculation.margin,
      sellingPrice: costCalculation.sellingPrice,
    });
    
    // Update input values when costCalculation changes
    setInputValues({
      materialCost: costCalculation.materialCost.toString(),
      cuttingCharge: (costCalculation.cuttingCharge / (orderQuantity || 1)).toString(),
      printingCharge: (costCalculation.printingCharge / (orderQuantity || 1)).toString(),
      stitchingCharge: (costCalculation.stitchingCharge / (orderQuantity || 1)).toString(),
      transportCharge: costCalculation.transportCharge.toString(),
    });
  }, [costCalculation, orderQuantity]);
  
  const [editableCosts, setEditableCosts] = useState({
    materialCost: costCalculation.materialCost,
    cuttingCharge: costCalculation.cuttingCharge,
    printingCharge: costCalculation.printingCharge,
    stitchingCharge: costCalculation.stitchingCharge,
    transportCharge: costCalculation.transportCharge,
    productionCost: costCalculation.productionCost,
    totalCost: costCalculation.totalCost,
    margin: costCalculation.margin,
    sellingPrice: costCalculation.sellingPrice,
  });
  
  // For direct editing
  const [inputValues, setInputValues] = useState({
    materialCost: costCalculation.materialCost.toString(),
    cuttingCharge: (costCalculation.cuttingCharge / (orderQuantity || 1)).toString(),
    printingCharge: (costCalculation.printingCharge / (orderQuantity || 1)).toString(),
    stitchingCharge: (costCalculation.stitchingCharge / (orderQuantity || 1)).toString(),
    transportCharge: costCalculation.transportCharge.toString(),
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = parseFloat(e.target.value);
    if (!isNaN(newMargin) && onMarginChange) {
      onMarginChange(newMargin);
    }
  };
  
  // Handle changes to any cost field
  const handleCostChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setEditableCosts(prev => ({
        ...prev,
        [type]: value
      }));
      
      if (onCostChange) {
        onCostChange(type, value);
      }
    }
  };

  // Calculate profit amount
  const profit = costCalculation.sellingPrice - costCalculation.totalCost;
  const profitIsPositive = profit > 0;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Cost Calculation</span>
          <button 
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Material Costs</h3>
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span>Material Cost</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-24 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                      value={inputValues.materialCost}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setInputValues(prev => ({
                          ...prev,
                          materialCost: value
                        }));
                        
                        const numValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleCostChange('materialCost', {
                            ...e,
                            target: {
                              ...e.target,
                              value: numValue.toString()
                            }
                          });
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
                {costCalculation.perUnitMaterialCost !== undefined && (
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per piece</span>
                    <span>{formatCurrency(costCalculation.perUnitMaterialCost)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Production Costs</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Cutting</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-20 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                          value={inputValues.cuttingCharge}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setInputValues(prev => ({
                              ...prev,
                              cuttingCharge: value
                            }));
                            
                            const perUnitValue = value === '' ? 0 : parseFloat(value);
                            if (!isNaN(perUnitValue)) {
                              const totalValue = perUnitValue * (orderQuantity || 1);
                              handleCostChange('cuttingCharge', {
                                ...e,
                                target: {
                                  ...e.target,
                                  value: totalValue.toString()
                                }
                              });
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Per unit</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(costCalculation.cuttingCharge)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Printing</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-20 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                          value={inputValues.printingCharge}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setInputValues(prev => ({
                              ...prev,
                              printingCharge: value
                            }));
                            
                            const perUnitValue = value === '' ? 0 : parseFloat(value);
                            if (!isNaN(perUnitValue)) {
                              const totalValue = perUnitValue * (orderQuantity || 1);
                              handleCostChange('printingCharge', {
                                ...e,
                                target: {
                                  ...e.target,
                                  value: totalValue.toString()
                                }
                              });
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Per unit</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(costCalculation.printingCharge)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Stitching</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-20 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                          value={inputValues.stitchingCharge}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setInputValues(prev => ({
                              ...prev,
                              stitchingCharge: value
                            }));
                            
                            const perUnitValue = value === '' ? 0 : parseFloat(value);
                            if (!isNaN(perUnitValue)) {
                              const totalValue = perUnitValue * (orderQuantity || 1);
                              handleCostChange('stitchingCharge', {
                                ...e,
                                target: {
                                  ...e.target,
                                  value: totalValue.toString()
                                }
                              });
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Per unit</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(costCalculation.stitchingCharge)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Transport</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-24 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                          value={inputValues.transportCharge}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setInputValues(prev => ({
                              ...prev,
                              transportCharge: value
                            }));
                            
                            const numValue = value === '' ? 0 : parseFloat(value);
                            if (!isNaN(numValue)) {
                              handleCostChange('transportCharge', {
                                ...e,
                                target: {
                                  ...e.target,
                                  value: numValue.toString()
                                }
                              });
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Total</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                      <span>Per unit</span>
                      <span>{formatCurrency(costCalculation.transportCharge / (orderQuantity || 1))}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Production Cost</span>
                    <span>{formatCurrency(costCalculation.productionCost)}</span>
                  </div>
                  {costCalculation.perUnitProductionCost !== undefined && (
                    <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                      <span>Per piece</span>
                      <span>{formatCurrency(costCalculation.perUnitProductionCost)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Cost</h3>
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Cost</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24 h-8 text-right"
                      value={editableCosts.materialCost + costCalculation.productionCost}
                      onChange={(e) => handleCostChange('totalCost', e)}
                    />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
                {costCalculation.perUnitCost !== undefined && (
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Cost per piece</span>
                    <span>{formatCurrency(costCalculation.perUnitCost)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between items-center font-medium">
                <span>Total Cost</span>
                <span>{formatCurrency(costCalculation.totalCost)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="margin">Profit Margin (%)</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={costCalculation.margin}
                onChange={handleMarginChange}
                className="max-w-xs"
              />
            </div>
            
            {/* Add profit amount section */}
            <div className="bg-slate-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span>Selling Price</span>
                <span className="font-medium">{formatCurrency(costCalculation.sellingPrice)}</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-md ${profitIsPositive ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center font-medium">
                <span>Profit</span>
                <span className={profitIsPositive ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Material Cost</Label>
                <div className="font-medium text-lg">{formatCurrency(costCalculation.materialCost)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Production Cost</Label>
                <div className="font-medium text-lg">{formatCurrency(costCalculation.productionCost)}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Total Cost</Label>
                <div className="font-medium text-lg">{formatCurrency(costCalculation.totalCost)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Margin</Label>
                <div className="font-medium text-lg">{costCalculation.margin}%</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Selling Price</Label>
                <div className="font-medium text-lg text-green-700">{formatCurrency(costCalculation.sellingPrice)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Profit</Label>
                <div className={`font-medium text-lg ${profitIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profit)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
