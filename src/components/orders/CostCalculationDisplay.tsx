import { useState, useEffect, useRef, useMemo } from "react";
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
  onCostCalculationUpdate?: (updatedCosts: {
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
  }) => void;
  orderQuantity?: number;
  components?: Record<string, unknown>;
  customComponents?: unknown[];
  readOnly?: boolean; // Flag to show only saved values without recalculation
}

export const CostCalculationDisplay = ({
  costCalculation,
  onMarginChange,
  onCostChange,
  onCostCalculationUpdate,
  orderQuantity = 1,
  components = {},
  customComponents = [],
  readOnly = false
}: CostCalculationDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate the actual material cost using the consumption values that will be saved to database
  const calculateActualMaterialCost = () => {
    const allComponents = [...Object.values(components), ...customComponents];
    
    return allComponents.reduce((total: number, comp: unknown) => {
      const component = comp as { consumption?: string | number; materialRate?: string | number; type?: string };
      if (!component || !component.consumption || !component.materialRate) return total;
      
      // Get the consumption value that will be saved to database
      const originalConsumption = parseFloat(String(component.consumption)) || 0;
      const materialRate = parseFloat(String(component.materialRate)) || 0;
      
      // For order form submission, consumption gets multiplied by order quantity
      // So we need to use that same calculation here
      const finalConsumption = originalConsumption * orderQuantity;
      const componentCost = finalConsumption * materialRate;
      
      console.log(`Material cost calculation: ${component.type || 'unknown'} - ${originalConsumption} × ${orderQuantity} × ${materialRate} = ${componentCost}`);
      
      return total + componentCost;
    }, 0);
  };
  
  // Use the calculated material cost instead of the one from props if components are available AND not in read-only mode
  const actualMaterialCost = !readOnly && components && Object.keys(components).length > 0 
    ? calculateActualMaterialCost()
    : costCalculation.materialCost;

  // Ensure actualMaterialCost is a number
  const materialCostValue = typeof actualMaterialCost === 'number' ? actualMaterialCost : 0;

  // Recalculate total costs using the correct material cost (only if not read-only)
  const recalculatedCosts = useMemo(() => {
    if (readOnly) {
      // In read-only mode, use exact values from database without recalculation
      return costCalculation;
    }
    
    return {
      ...costCalculation,
      materialCost: materialCostValue,
      baseCost: materialCostValue + costCalculation.cuttingCharge + costCalculation.printingCharge + costCalculation.stitchingCharge,
      totalCost: materialCostValue + costCalculation.cuttingCharge + costCalculation.printingCharge + costCalculation.stitchingCharge + costCalculation.transportCharge + costCalculation.gstAmount,
      perUnitBaseCost: orderQuantity > 0 ? (materialCostValue + costCalculation.cuttingCharge + costCalculation.printingCharge + costCalculation.stitchingCharge) / orderQuantity : 0,
      perUnitCost: orderQuantity > 0 ? (materialCostValue + costCalculation.cuttingCharge + costCalculation.printingCharge + costCalculation.stitchingCharge + costCalculation.transportCharge + costCalculation.gstAmount) / orderQuantity : 0,
      sellingPrice: (materialCostValue + costCalculation.cuttingCharge + costCalculation.printingCharge + costCalculation.stitchingCharge + costCalculation.transportCharge + costCalculation.gstAmount) * (1 + (costCalculation.margin / 100))
    };
  }, [materialCostValue, costCalculation, orderQuantity, readOnly]);
  
  // Notify parent component when costs are recalculated (only if not read-only)
  useEffect(() => {
    if (!readOnly && onCostCalculationUpdate && (components && Object.keys(components).length > 0)) {
      onCostCalculationUpdate(recalculatedCosts);
    }
  }, [recalculatedCosts, onCostCalculationUpdate, components, readOnly]);
  
  // Make sure we always update state when the props change
  useEffect(() => {
    setEditableCosts({
      materialCost: recalculatedCosts.materialCost,
      cuttingCharge: recalculatedCosts.cuttingCharge,
      printingCharge: recalculatedCosts.printingCharge,
      stitchingCharge: recalculatedCosts.stitchingCharge,
      transportCharge: recalculatedCosts.transportCharge,
      baseCost: recalculatedCosts.baseCost,
      gstAmount: recalculatedCosts.gstAmount,
      totalCost: recalculatedCosts.totalCost,
      margin: recalculatedCosts.margin,
      sellingPrice: recalculatedCosts.sellingPrice,
    });
    
    // Update input values when costCalculation changes
    setInputValues({
      materialCost: recalculatedCosts.materialCost.toString(),
      cuttingCharge: (recalculatedCosts.cuttingCharge / (orderQuantity || 1)).toString(),
      printingCharge: (recalculatedCosts.printingCharge / (orderQuantity || 1)).toString(),
      stitchingCharge: (recalculatedCosts.stitchingCharge / (orderQuantity || 1)).toString(),
      transportCharge: (recalculatedCosts.transportCharge / (orderQuantity || 1)).toString(),
    });
  }, [costCalculation, orderQuantity, recalculatedCosts]);
  
  const [editableCosts, setEditableCosts] = useState({
    materialCost: recalculatedCosts.materialCost,
    cuttingCharge: recalculatedCosts.cuttingCharge,
    printingCharge: recalculatedCosts.printingCharge,
    stitchingCharge: recalculatedCosts.stitchingCharge,
    transportCharge: recalculatedCosts.transportCharge,
    baseCost: recalculatedCosts.baseCost,
    gstAmount: recalculatedCosts.gstAmount,
    totalCost: recalculatedCosts.totalCost,
    margin: recalculatedCosts.margin,
    sellingPrice: recalculatedCosts.sellingPrice,
  });
  
  // For direct editing
  const [inputValues, setInputValues] = useState({
    materialCost: recalculatedCosts.materialCost.toString(),
    cuttingCharge: (recalculatedCosts.cuttingCharge / (orderQuantity || 1)).toString(),
    printingCharge: (recalculatedCosts.printingCharge / (orderQuantity || 1)).toString(),
    stitchingCharge: (recalculatedCosts.stitchingCharge / (orderQuantity || 1)).toString(),
    transportCharge: (recalculatedCosts.transportCharge / (orderQuantity || 1)).toString(),
  });
  
  const formatCurrency = (value: number) => {
    // Handle NaN values by returning 0
    const safeValue = isNaN(value) ? 0 : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(safeValue);
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
  const profit = recalculatedCosts.sellingPrice - recalculatedCosts.totalCost;
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
                      readOnly={readOnly}
                      onChange={(e) => {
                        if (readOnly) return;
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
                  <span>{formatCurrency(isNaN(recalculatedCosts.perUnitBaseCost) ? 0 : recalculatedCosts.perUnitBaseCost)}</span>
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
                          readOnly={readOnly}
                          onChange={(e) => {
                            if (readOnly) return;
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
                      <span>{formatCurrency(recalculatedCosts.cuttingCharge)}</span>
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
                          readOnly={readOnly}
                          onChange={(e) => {
                            if (readOnly) return;
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
                      <span>{formatCurrency(recalculatedCosts.printingCharge)}</span>
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
                          readOnly={readOnly}
                          onChange={(e) => {
                            if (readOnly) return;
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
                      <span>{formatCurrency(recalculatedCosts.stitchingCharge)}</span>
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
                          readOnly={readOnly}
                          onChange={(e) => {
                            if (readOnly) return;
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
                      <span>{formatCurrency(recalculatedCosts.transportCharge)}</span>
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
                    <span>Transport Cost</span>
                    <span>{formatCurrency(recalculatedCosts.transportCharge)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(isNaN(recalculatedCosts.perUnitTransportCost) ? 0 : recalculatedCosts.perUnitTransportCost)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-md font-medium">
                  <div className="flex justify-between items-center">
                    <span>Total Cost</span>
                    <span>{formatCurrency(recalculatedCosts.totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(isNaN(recalculatedCosts.perUnitCost) ? 0 : recalculatedCosts.perUnitCost)}</span>
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
                        value={recalculatedCosts.margin.toString()}
                        readOnly={readOnly}
                        onChange={readOnly ? undefined : handleMarginChange}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md font-medium">
                  <div className="flex justify-between items-center">
                    <span>Selling Price</span>
                    <span>{formatCurrency(recalculatedCosts.sellingPrice)}</span>
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
              <span className="font-medium">{formatCurrency(recalculatedCosts.totalCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Selling Price:</span>
              <span className="font-medium">{formatCurrency(recalculatedCosts.sellingPrice)}</span>
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
