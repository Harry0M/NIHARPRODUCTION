
import React from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow, Table, TableHead, TableHeader, TableBody } from "@/components/ui/table";
import { LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Material {
  id: string;
  material_name: string;
  color?: string | null;
  gsm?: string | null;
  quantity?: number;
  unit?: string;
}

export interface CatalogComponent {
  id: string;
  component_type: string;
  size?: string | null;
  color?: string | null;
  gsm?: number | null;
  custom_name?: string | null;
  roll_width?: number | null;
  length?: number | null;
  width?: number | null;
  consumption?: number | null;
  material_id?: string | null;
  material_linked?: boolean | null;
  material?: Material | null;
  formula?: 'standard' | 'linear';
}

interface ComponentsTableProps {
  components: CatalogComponent[];
  onViewComponent: (id: string) => void;
  onLinkMaterial: (id: string) => void;
  defaultQuantity?: number | null;
}

export const ComponentsTable = ({ 
  components, 
  onViewComponent, 
  onLinkMaterial,
  defaultQuantity = 1
}: ComponentsTableProps) => {
  if (!components || components.length === 0) {
    return <p className="text-muted-foreground text-sm my-4">No components have been added to this product.</p>;
  }

  // Function to get component display name based on component_type
  const getComponentTypeName = (componentType: string) => {
    const componentTypeLabels: Record<string, string> = {
      part: "Part",
      border: "Border", 
      handle: "Handle",
      chain: "Chain",
      runner: "Runner",
      piping: "Piping",
      custom: "Custom Component",
      // Adding uppercase first letter versions for components coming from the database
      Part: "Part",
      Border: "Border",
      Handle: "Handle",
      Chain: "Chain",
      Runner: "Runner",
      Piping: "Piping",
      Custom: "Custom Component"
    };

    return componentTypeLabels[componentType] || componentType;
  };

  // Function to calculate consumption based on formula and quantity
  const calculateDisplayConsumption = (component: CatalogComponent) => {
    const quantity = defaultQuantity || 1;
    
    console.log(`Calculating consumption for component:`, {
      type: component.component_type,
      formula: component.formula,
      storedConsumption: component.consumption,
      length: component.length,
      quantity: quantity
    });
    
    if (!component.consumption) {
      return 0;
    }
    
    let calculatedConsumption = 0;
    const baseConsumption = Number(component.consumption);
    
    if (component.formula === 'linear') {
      // Linear formula: (length * quantity) / 39.37
      if (component.length && quantity > 0) {
        const totalLengthInInches = Number(component.length) * quantity;
        calculatedConsumption = totalLengthInInches / 39.37;
        console.log(`Linear calculation: ${component.length} × ${quantity} ÷ 39.37 = ${calculatedConsumption}`);
      } else {
        // Fallback: use stored consumption * quantity for linear
        calculatedConsumption = baseConsumption * quantity;
        console.log(`Linear fallback: ${baseConsumption} × ${quantity} = ${calculatedConsumption}`);
      }
    } else {
      // Standard formula: stored consumption * quantity
      calculatedConsumption = baseConsumption * quantity;
      console.log(`Standard calculation: ${baseConsumption} × ${quantity} = ${calculatedConsumption}`);
    }
    
    return calculatedConsumption;
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium text-slate-600">Type</TableHead>
            <TableHead className="font-medium text-slate-600">Details</TableHead>
            <TableHead className="font-medium text-slate-600">Material</TableHead>
            <TableHead className="text-right font-medium text-slate-600">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.map((component) => {
            const displayConsumption = calculateDisplayConsumption(component);
            
            return (
              <TableRow key={component.id}>
                <TableCell className="font-medium">
                  {getComponentTypeName(component.component_type)}
                  {component.custom_name && 
                    <span className="block text-xs text-muted-foreground mt-1">
                      {component.custom_name}
                    </span>
                  }
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {component.size && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Size:</span> {component.size}
                      </span>
                    )}
                    {component.color && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Color:</span> {component.color}
                      </span>
                    )}
                    {component.gsm && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">GSM:</span> {component.gsm}
                      </span>
                    )}
                    {component.consumption !== null && component.consumption !== undefined && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Total Consumption:</span> 
                        <span>{displayConsumption.toFixed(4)} meters</span>
                        {defaultQuantity && defaultQuantity > 1 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {component.formula === 'linear' 
                              ? `(${component.length} × ${defaultQuantity} ÷ 39.37)` 
                              : `(${Number(component.consumption).toFixed(4)} × ${defaultQuantity})`
                            }
                          </span>
                        )}
                      </span>
                    )}
                    {component.formula && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Formula:</span> 
                        <Badge variant={component.formula === 'linear' ? 'secondary' : 'outline'} className="text-xs">
                          {component.formula === 'standard' ? 'Standard' : 'Linear'}
                        </Badge>
                      </span>
                    )}
                    {component.roll_width && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Roll Width:</span> {component.roll_width}"
                      </span>
                    )}
                    {component.length && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Length:</span> {component.length}"
                      </span>
                    )}
                    {component.width && (
                      <span className="text-xs flex items-center gap-1">
                        <span className="font-medium">Width:</span> {component.width}"
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {component.material ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{component.material.material_name}</span>
                      <div className="flex gap-2 mt-1">
                        {component.material.color && (
                          <Badge variant="outline" className="text-xs">
                            {component.material.color}
                          </Badge>
                        )}
                        {component.material.gsm && (
                          <Badge variant="outline" className="text-xs">
                            {component.material.gsm} GSM
                          </Badge>
                        )}
                        {component.material.unit && (
                          <Badge variant="outline" className="text-xs">
                            {component.material.unit}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "flex items-center text-xs text-muted-foreground",
                      component.material_id && "text-yellow-600"
                    )}>
                      {component.material_id ? "Material reference exists but details missing" : "No material linked"}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => onViewComponent(component.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => onLinkMaterial(component.id)}
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      {component.material ? "Change" : "Link"} Material
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
