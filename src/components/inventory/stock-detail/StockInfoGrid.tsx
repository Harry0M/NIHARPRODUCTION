
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StockInfoGridProps {
  stockItem: any;
  linkedComponents?: any[];
}

export const StockInfoGrid = ({ stockItem, linkedComponents = [] }: StockInfoGridProps) => {
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
      // Adding uppercase first letter versions for components coming from the database
      Part: "Part",
      Border: "Border",
      Handle: "Handle",
      Chain: "Chain",
      Runner: "Runner",
      Custom: "Custom Component"
    };

    return componentTypeLabels[componentType] || componentType;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Material Name</p>
              <p className="font-medium">{formatValue(stockItem.material_name)}</p>
            </div>
            {stockItem.color && (
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium">{formatValue(stockItem.color)}</p>
              </div>
            )}
            {stockItem.gsm && (
              <div>
                <p className="text-sm text-muted-foreground">GSM</p>
                <p className="font-medium">{formatValue(stockItem.gsm)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-medium">{formatValue(stockItem.quantity)} {formatValue(stockItem.unit)}</p>
            </div>
            {stockItem.alternate_unit && (
              <div>
                <p className="text-sm text-muted-foreground">Alternate Unit</p>
                <p className="font-medium">
                  {formatValue(stockItem.quantity * (stockItem.conversion_rate || 1))} {formatValue(stockItem.alternate_unit)}
                </p>
              </div>
            )}
            {stockItem.conversion_rate && (
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="font-medium">1 {formatValue(stockItem.unit)} = {formatValue(stockItem.conversion_rate)} {formatValue(stockItem.alternate_unit)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {stockItem.track_cost && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Cost Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="font-medium">₹{formatValue(stockItem.purchase_price)} / {formatValue(stockItem.unit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selling Price</p>
                <p className="font-medium">₹{formatValue(stockItem.selling_price)} / {formatValue(stockItem.unit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Additional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {stockItem.suppliers && (
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="font-medium">{formatValue(stockItem.suppliers.name)}</p>
              </div>
            )}
            {stockItem.reorder_level !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Reorder Level</p>
                <p className="font-medium">{formatValue(stockItem.reorder_level)} {formatValue(stockItem.unit)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {linkedComponents && linkedComponents.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Linked Components</h3>
            <div className="space-y-4">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
