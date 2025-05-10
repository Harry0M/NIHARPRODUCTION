
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StockTransaction } from "@/types/inventory";
import { StockTransactionHistory } from "./StockTransactionHistory";

interface StockInfoGridProps {
  stockItem: any;
  linkedComponents?: any[];
  transactions?: StockTransaction[];
}

export const StockInfoGrid = ({ stockItem, linkedComponents = [], transactions = [] }: StockInfoGridProps) => {
  if (!stockItem) return null;
  
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  // Function to get component display name based on component_type
  const getComponentTypeName = (componentType: string) => {
    const componentTypeLabels: Record<string, string> = {
      part: "Part",
      border: "Border",
      handle: "Handle",
      chain: "Chain",
      runner: "Runner",
      custom: "Custom Component",
      Part: "Part",
      Border: "Border",
      Handle: "Handle",
      Chain: "Chain",
      Runner: "Runner",
      Custom: "Custom Component"
    };

    return componentTypeLabels[componentType] || componentType;
  };

  // Calculate inventory value
  const inventoryValue = stockItem.track_cost && stockItem.purchase_price ? 
    (stockItem.quantity * stockItem.purchase_price).toFixed(2) : null;

  // Check if stock level is low
  const isLowStock = stockItem.reorder_level !== null && 
    stockItem.quantity < stockItem.reorder_level;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stock Summary Card - Most critical information at a glance */}
      <Card 
        className={`border-border/60 overflow-hidden ${isLowStock ? "border-red-300 bg-red-50/80 dark:bg-red-950/20" : "bg-card dark:bg-card/95"}`}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-primary">Stock Summary</h3>
            {isLowStock && (
              <Badge variant="destructive" className="px-2 py-1 shadow-sm animate-pulse">
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Low Stock
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3 border-b border-border/40 pb-3 mb-3">
              <p className="text-sm text-muted-foreground font-medium">Material</p>
              <p className="text-xl font-medium">{formatValue(stockItem.material_name)}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {stockItem.color && <Badge variant="outline" className="bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 border-border/60 text-sm font-normal">{formatValue(stockItem.color)}</Badge>}
                {stockItem.gsm && <Badge variant="outline" className="bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 border-border/60 text-sm font-normal">{formatValue(stockItem.gsm)} GSM</Badge>}
                {stockItem.material_categories && (
                  <Badge variant="secondary" className="bg-secondary/90 text-secondary-foreground hover:bg-secondary text-sm font-normal">{formatValue(stockItem.material_categories?.name)}</Badge>
                )}
              </div>
            </div>
            
            {/* Current stock - highlight this information */}
            <div className="col-span-2 md:col-span-1 bg-primary/5 dark:bg-primary/10 rounded-md p-4 border border-primary/10 dark:border-primary/20 shadow-sm">
              <p className="text-sm text-muted-foreground font-medium">Current Stock</p>
              <p className="text-2xl font-bold text-primary">{formatValue(stockItem.quantity)} <span className="text-sm font-normal text-muted-foreground">{formatValue(stockItem.unit)}</span></p>
              {stockItem.alternate_unit && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatValue(stockItem.quantity * (stockItem.conversion_rate || 1))} {formatValue(stockItem.alternate_unit)}
                </p>
              )}
            </div>
            
            {/* Inventory value - important financial metric */}
            {inventoryValue && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-100 dark:border-blue-800/30 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">Inventory Value</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{inventoryValue}</p>
                <p className="text-sm text-muted-foreground mt-1">@ ₹{formatValue(stockItem.purchase_price)}/{formatValue(stockItem.unit)}</p>
              </div>
            )}
            
            {/* Reorder information - critical for stock management */}
            {stockItem.reorder_level !== null && (
              <div className={`rounded-md p-4 border shadow-sm ${isLowStock ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'}`}>
                <p className="text-sm text-muted-foreground font-medium">Reorder Point</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatValue(stockItem.reorder_level)} <span className="text-sm font-normal text-muted-foreground">{formatValue(stockItem.unit)}</span></p>
                {stockItem.reorder_quantity && (
                  <p className="text-sm text-muted-foreground mt-1">Order qty: {formatValue(stockItem.reorder_quantity)} {formatValue(stockItem.unit)}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Linked Components - Important for production planning */}
      {linkedComponents && linkedComponents.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Usage in {linkedComponents.length} Product{linkedComponents.length !== 1 ? 's' : ''}</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {linkedComponents.map((component) => (
                <div key={component.id} className="flex flex-col space-y-2 p-3 bg-secondary/20 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {getComponentTypeName(component.component_type)}
                      {component.custom_name && `: ${component.custom_name}`}
                    </span>
                    <Badge variant="outline">{component.catalog?.name || "Unknown Product"}</Badge>
                  </div>
                  {component.consumption && (
                    <p className="text-sm text-muted-foreground">
                      Consumption: {component.consumption.toFixed(2)} {stockItem.unit}
                    </p>
                  )}
                  {(component.size || (component.length && component.width)) && (
                    <p className="text-sm text-muted-foreground">
                      Size: {component.size || `${component.length}x${component.width}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Technical Details Card - Combine unit info, specs, etc. */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Technical Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stockItem.unit && (
              <div>
                <p className="text-sm text-muted-foreground">Primary Unit</p>
                <p className="font-medium">{formatValue(stockItem.unit)}</p>
              </div>
            )}
            {stockItem.alternate_unit && (
              <div>
                <p className="text-sm text-muted-foreground">Alternate Unit</p>
                <p className="font-medium">{formatValue(stockItem.alternate_unit)}</p>
              </div>
            )}
            {stockItem.conversion_rate && (
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="font-medium">1 {formatValue(stockItem.unit)} = {formatValue(stockItem.conversion_rate)} {formatValue(stockItem.alternate_unit)}</p>
              </div>
            )}
            {stockItem.gsm && (
              <div>
                <p className="text-sm text-muted-foreground">GSM</p>
                <p className="font-medium">{formatValue(stockItem.gsm)}</p>
              </div>
            )}
            {stockItem.roll_width && (
              <div>
                <p className="text-sm text-muted-foreground">Roll Width</p>
                <p className="font-medium">{formatValue(stockItem.roll_width)} inches</p>
              </div>
            )}
            {stockItem.location_id && (
              <div>
                <p className="text-sm text-muted-foreground">Storage Location</p>
                <p className="font-medium">{formatValue(stockItem.location_id)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{formatValue(stockItem.status)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Track Cost</p>
              <p className="font-medium">{formatValue(stockItem.track_cost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Financial Card - Purchasing and cost information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Purchasing & Cost Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p className="font-medium">₹{formatValue(stockItem.purchase_rate || stockItem.purchase_price)} / {formatValue(stockItem.unit)}</p>
            </div>
            {stockItem.selling_price && (
              <div>
                <p className="text-sm text-muted-foreground">Selling Price</p>
                <p className="font-medium">₹{formatValue(stockItem.selling_price)} / {formatValue(stockItem.unit)}</p>
              </div>
            )}
            {inventoryValue && (
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="font-medium">₹{inventoryValue}</p>
              </div>
            )}
            {stockItem.min_stock_level !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Minimum Stock Level</p>
                <p className="font-medium">{formatValue(stockItem.min_stock_level)} {formatValue(stockItem.unit)}</p>
              </div>
            )}
            {stockItem.reorder_level !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Reorder Level</p>
                <p className="font-medium">{formatValue(stockItem.reorder_level)} {formatValue(stockItem.unit)}</p>
              </div>
            )}
            {stockItem.reorder_quantity !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Reorder Quantity</p>
                <p className="font-medium">{formatValue(stockItem.reorder_quantity)} {formatValue(stockItem.unit)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Supplier Card - More compact supplier info */}
      {stockItem.suppliers && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Supplier Information</h3>
              {stockItem.suppliers.phone && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  {formatValue(stockItem.suppliers.phone)}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-secondary/10 p-4 rounded-md">
                <div className="text-lg font-medium">{formatValue(stockItem.suppliers.name)}</div>
                {stockItem.suppliers.contact_person && (
                  <div className="text-sm mt-1">
                    Contact: {formatValue(stockItem.suppliers.contact_person)}
                  </div>
                )}
                {stockItem.suppliers.email && (
                  <div className="text-sm mt-1">
                    Email: {formatValue(stockItem.suppliers.email)}
                  </div>
                )}
                {stockItem.suppliers.address && (
                  <div className="text-sm mt-2 text-muted-foreground">
                    {formatValue(stockItem.suppliers.address)}
                  </div>
                )}
                {stockItem.suppliers.payment_terms && (
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">Payment Terms:</span> {formatValue(stockItem.suppliers.payment_terms)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Transaction History Card */}
      {transactions && transactions.length > 0 && (
        <StockTransactionHistory transactions={transactions} />
      )}
    </div>
  );
};
