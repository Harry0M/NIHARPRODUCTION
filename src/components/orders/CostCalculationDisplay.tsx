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
    baseCost?: number;
    gstAmount?: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
    perUnitBaseCost?: number;
    perUnitTransportCost?: number;
    perUnitGstCost?: number;
    perUnitCost?: number;
  };
  onMarginChange?: (margin: number) => void;
  onCostChange?: (type: string, value: number) => void;
  onTotalCostChange?: (totalCost: number) => void;
  onSellingPriceChange?: (sellingPrice: number) => void;
  onProfitChange?: (profit: number) => void;
  orderQuantity?: number;
}

export const CostCalculationDisplay = ({
  costCalculation,
  onMarginChange,
  onCostChange,
  onTotalCostChange,
  onSellingPriceChange,
  onProfitChange,
  orderQuantity = 1
}: CostCalculationDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Make sure we always update state when the props change
  useEffect(() => {
    // Only update if values have actually changed to prevent unnecessary re-renders
    const newEditableCosts = {
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
    };

    const newInputValues = {
      materialCost: costCalculation.materialCost.toString(),
      cuttingCharge: (costCalculation.cuttingCharge / (orderQuantity || 1)).toString(),
      printingCharge: (costCalculation.printingCharge / (orderQuantity || 1)).toString(),
      stitchingCharge: (costCalculation.stitchingCharge / (orderQuantity || 1)).toString(),
      transportCharge: (costCalculation.transportCharge / (orderQuantity || 1)).toString(),
      margin: costCalculation.margin.toString(),
      totalCost: costCalculation.totalCost.toString(),
      sellingPrice: costCalculation.sellingPrice.toString(),
      sellingPricePerPiece: (costCalculation.sellingPrice / (orderQuantity || 1)).toString(),
    };

    // Batch the state updates to prevent multiple re-renders
    setEditableCosts(newEditableCosts);
    setInputValues(newInputValues);
  }, [costCalculation.materialCost, costCalculation.cuttingCharge, costCalculation.printingCharge, 
      costCalculation.stitchingCharge, costCalculation.transportCharge, costCalculation.totalCost, 
      costCalculation.margin, costCalculation.sellingPrice, costCalculation.baseCost, 
      costCalculation.gstAmount, orderQuantity]);
  
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
    margin: costCalculation.margin.toString(),
    totalCost: costCalculation.totalCost.toString(),
    sellingPrice: costCalculation.sellingPrice.toString(),
    sellingPricePerPiece: (costCalculation.sellingPrice / (orderQuantity || 1)).toString(),
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
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInputValues(prev => ({
      ...prev,
      margin: value
    }));
    
    const newMargin = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newMargin) && onSellingPriceChange && costCalculation.totalCost > 0) {
      // When margin changes, calculate new selling price: sellingPrice = totalCost * (1 + margin/100)
      const newSellingPrice = costCalculation.totalCost * (1 + newMargin / 100);
      onSellingPriceChange(newSellingPrice);
      
      // Update selling price input values
      setInputValues(prev => ({
        ...prev,
        sellingPrice: newSellingPrice.toString(),
        sellingPricePerPiece: (newSellingPrice / (orderQuantity || 1)).toString()
      }));
      
      if (onMarginChange) {
        onMarginChange(newMargin);
      }
    }
  };

  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInputValues(prev => ({
      ...prev,
      totalCost: value
    }));
    
    const newTotalCost = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newTotalCost) && onTotalCostChange) {
      onTotalCostChange(newTotalCost);
      
      // When total cost changes, recalculate margin based on current selling price
      if (newTotalCost > 0 && costCalculation.sellingPrice > 0) {
        const newMargin = ((costCalculation.sellingPrice - newTotalCost) / newTotalCost) * 100;
        setInputValues(prev => ({
          ...prev,
          margin: newMargin.toFixed(2)
        }));
        if (onMarginChange) {
          onMarginChange(newMargin);
        }
      }
    }
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInputValues(prev => ({
      ...prev,
      sellingPrice: value,
      sellingPricePerPiece: value === '' ? '0' : (parseFloat(value) / (orderQuantity || 1)).toString()
    }));
    
    const newSellingPrice = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newSellingPrice) && onSellingPriceChange) {
      onSellingPriceChange(newSellingPrice);
      
      // Calculate and update margin
      if (costCalculation.totalCost > 0) {
        const newMargin = ((newSellingPrice - costCalculation.totalCost) / costCalculation.totalCost) * 100;
        setInputValues(prev => ({
          ...prev,
          margin: newMargin.toFixed(2)
        }));
        if (onMarginChange) {
          onMarginChange(newMargin);
        }
      }
    }
  };

  const handleSellingPricePerPieceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInputValues(prev => ({
      ...prev,
      sellingPricePerPiece: value,
      sellingPrice: value === '' ? '0' : (parseFloat(value) * (orderQuantity || 1)).toString()
    }));
    
    const newSellingPricePerPiece = value === '' ? 0 : parseFloat(value);
    const newTotalSellingPrice = newSellingPricePerPiece * (orderQuantity || 1);
    if (!isNaN(newTotalSellingPrice) && onSellingPriceChange) {
      onSellingPriceChange(newTotalSellingPrice);
      
      // Calculate and update margin
      if (costCalculation.totalCost > 0) {
        const newMargin = ((newTotalSellingPrice - costCalculation.totalCost) / costCalculation.totalCost) * 100;
        setInputValues(prev => ({
          ...prev,
          margin: newMargin.toFixed(2)
        }));
        if (onMarginChange) {
          onMarginChange(newMargin);
        }
      }
    }
  };

  const handleProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.-]/g, ''); // Allow negative values for profit
    const newProfit = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(newProfit) && onSellingPriceChange) {
      // If profit changes, calculate new selling price: sellingPrice = totalCost + profit
      const newSellingPrice = costCalculation.totalCost + newProfit;
      onSellingPriceChange(newSellingPrice);
      
      // Update selling price input values
      setInputValues(prev => ({
        ...prev,
        sellingPrice: newSellingPrice.toString(),
        sellingPricePerPiece: (newSellingPrice / (orderQuantity || 1)).toString()
      }));
      
      // Calculate and update margin based on new selling price
      if (costCalculation.totalCost > 0) {
        const newMargin = (newProfit / costCalculation.totalCost) * 100;
        setInputValues(prev => ({
          ...prev,
          margin: newMargin.toFixed(2)
        }));
        if (onMarginChange) {
          onMarginChange(newMargin);
        }
      }
    }
  };
  
  // Handle changes to any cost field - PURE SUM ONLY
  const handleCostChange = (type: string, totalValue: number) => {
    // Update the specific cost component with the TOTAL value
    const updatedCosts = {
      ...editableCosts,
      [type]: totalValue
    };
    
    setEditableCosts(updatedCosts);
    
    // Calculate new total cost as PURE SUM of all components
    const newTotalCost = (updatedCosts.materialCost || 0) + 
                        (updatedCosts.cuttingCharge || 0) + 
                        (updatedCosts.printingCharge || 0) + 
                        (updatedCosts.stitchingCharge || 0) + 
                        (updatedCosts.transportCharge || 0);
    
    // Debug logging - simplified
    console.log('Pure Sum Calculation:', {
      materialCost: updatedCosts.materialCost || 0,
      cuttingCharge: updatedCosts.cuttingCharge || 0,
      printingCharge: updatedCosts.printingCharge || 0,
      stitchingCharge: updatedCosts.stitchingCharge || 0,
      transportCharge: updatedCosts.transportCharge || 0,
      pureSum: newTotalCost,
      changedComponent: type,
      changedValue: totalValue
    });
    
    // Update total cost input
    setInputValues(prev => ({
      ...prev,
      totalCost: newTotalCost.toString()
    }));
    
    // Notify parent components
    if (onCostChange) {
      onCostChange(type, totalValue);
    }
    
    if (onTotalCostChange) {
      onTotalCostChange(newTotalCost);
    }
    
    // Recalculate margin based on new total cost
    if (newTotalCost > 0 && costCalculation.sellingPrice > 0) {
      const newMargin = ((costCalculation.sellingPrice - newTotalCost) / newTotalCost) * 100;
      setInputValues(prev => ({
        ...prev,
        margin: newMargin.toFixed(2)
      }));
      if (onMarginChange) {
        onMarginChange(newMargin);
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
                          handleCostChange('materialCost', numValue);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.materialCost / (orderQuantity || 1))}</span>
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
                              handleCostChange('cuttingCharge', totalValue);
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
                              handleCostChange('printingCharge', totalValue);
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
                              handleCostChange('stitchingCharge', totalValue);
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
                              handleCostChange('transportCharge', totalValue);
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
                    <span>Transport Cost</span>
                    <span>{formatCurrency(costCalculation.transportCharge)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.transportCharge / (orderQuantity || 1))}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-md font-medium">
                  <div className="flex justify-between items-center">
                    <span>Total Cost</span>
                    {onTotalCostChange ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-24 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2 font-medium"
                          value={inputValues.totalCost}
                          onChange={handleTotalCostChange}
                        />
                      </div>
                    ) : (
                      <span>{formatCurrency(costCalculation.totalCost)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per unit</span>
                    <span>{formatCurrency(costCalculation.totalCost / (orderQuantity || 1))}</span>
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
                        value={inputValues.margin}
                        onChange={handleMarginChange}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md font-medium">
                  <div className="flex justify-between items-center">
                    <span>Selling Price</span>
                    {onSellingPriceChange ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-24 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2 font-medium"
                          value={inputValues.sellingPrice}
                          onChange={handleSellingPriceChange}
                        />
                        <span className="text-xs text-muted-foreground">Total</span>
                      </div>
                    ) : (
                      <span>{formatCurrency(costCalculation.sellingPrice)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                    <span>Per piece</span>
                    {onSellingPriceChange ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-20 h-6 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-1 text-xs"
                          value={inputValues.sellingPricePerPiece}
                          onChange={handleSellingPricePerPieceChange}
                        />
                      </div>
                    ) : (
                      <span>{formatCurrency(costCalculation.sellingPrice / (orderQuantity || 1))}</span>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span>Selling Rate Per Piece</span>
                    <span className="font-medium">{formatCurrency(costCalculation.sellingPrice / (orderQuantity || 1))}</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-green-900">Total Profit</span>
                    {onSellingPriceChange ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`w-24 h-8 text-right bg-white border border-blue-200 focus:border-blue-400 rounded-md px-2 font-medium ${profitIsPositive ? "text-green-600" : "text-red-600"}`}
                          value={profit.toFixed(2)}
                          onChange={handleProfitChange}
                        />
                      </div>
                    ) : (
                      <span className={`font-medium ${profitIsPositive ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(profit)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-green-700">
                    Formula: Selling Price ({formatCurrency(costCalculation.sellingPrice)}) - Total Cost ({formatCurrency(costCalculation.totalCost)})
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-green-700">Margin %:</span>
                    <span className={`font-medium ${profitIsPositive ? "text-green-600" : "text-red-600"}`}>
                      {costCalculation.totalCost > 0 ? 
                        `${((profit / costCalculation.totalCost) * 100).toFixed(2)}%` : 
                        '0.00%'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Margin = (Profit ÷ Total Cost) × 100
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Calculation Summary</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Profit = Selling Price - Total Cost</div>
                <div>Margin % = (Profit ÷ Total Cost) × 100</div>
              </div>
            </div>
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Margin:</span>
                <span className={`font-medium ${profitIsPositive ? "text-green-600" : "text-red-600"}`}>
                  {costCalculation.totalCost > 0 ? 
                    `${((profit / costCalculation.totalCost) * 100).toFixed(2)}%` : 
                    '0.00%'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
