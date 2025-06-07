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
    baseCost: number;
    gstAmount: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
    perUnitBaseCost: number;
    perUnitTransportCost: number;
    perUnitGstCost: number;
    perUnitCost: number;
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
      baseCost: costCalculation.baseCost,
      gstAmount: costCalculation.gstAmount,
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
      transportCharge: (costCalculation.transportCharge / (orderQuantity || 1)).toString(),
    });
  }, [costCalculation, orderQuantity]);
  
  const [editableCosts, setEditableCosts] = useState({
    materialCost: costCalculation.materialCost,
    cuttingCharge: costCalculation.cuttingCharge,
    printingCharge: costCalculation.printingCharge,
    stitchingCharge: costCalculation.stitchingCharge,
    transportCharge: costCalculation.transportCharge,
    baseCost: costCalculation.baseCost,
    gstAmount: costCalculation.gstAmount,
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
    transportCharge: (costCalculation.transportCharge / (orderQuantity || 1)).toString(),
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
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Base Costs</h3>
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
                <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                  <span>Per unit</span>
                  <span>{formatCurrency(costCalculation.perUnitBaseCost)}</span>
                </div>
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
                          className="w-20 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                          value={inputValues.transportCharge}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setInputValues(prev => ({
                              ...prev,
                              transportCharge: value
                            }));
                            
                            const perUnitValue = value === '' ? 0 : parseFloat(value);
                            if (!isNaN(perUnitValue)) {
                              const totalValue = perUnitValue * (orderQuantity || 1);
                              handleCostChange('transportCharge', {
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
                      <span>{formatCurrency(costCalculation.transportCharge)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Cost Summary</h3>
              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span>Base Cost</span>
                    <span>{formatCurrency(costCalculation.baseCost)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.perUnitBaseCost)}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span>Transport Cost</span>
                    <span>{formatCurrency(costCalculation.transportCharge)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.perUnitTransportCost)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span>GST</span>
                    <span>{formatCurrency(costCalculation.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.perUnitGstCost)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-md font-medium">
                  <div className="flex justify-between items-center">
                    <span>Total Cost</span>
                    <span>{formatCurrency(costCalculation.totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.perUnitCost)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Pricing</h3>
              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span>Margin</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-20 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2"
                        value={costCalculation.margin.toString()}
                        onChange={handleMarginChange}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md font-medium">
                  <div className="flex justify-between items-center">
                    <span>Selling Price</span>
                    <span>{formatCurrency(costCalculation.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Profit</span>
                    <span className={profitIsPositive ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(profit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-medium">{formatCurrency(costCalculation.totalCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Selling Price:</span>
              <span className="font-medium">{formatCurrency(costCalculation.sellingPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Profit:</span>
              <span className={`font-medium ${profitIsPositive ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(profit)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
