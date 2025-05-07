
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
  material?: Material | null;
  material_linked?: boolean | null;
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
          {components.map((component) => (
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
                      {defaultQuantity && defaultQuantity > 1 
                        ? (component.consumption * defaultQuantity).toFixed(2)
                        : component.consumption.toFixed(2)
                      }
                      {defaultQuantity && defaultQuantity > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({component.consumption.toFixed(2)} × {defaultQuantity})
                        </span>
                      )}
                    </span>
                  )}
                  {component.roll_width && (
                    <span className="text-xs flex items-center gap-1">
                      <span className="font-medium">Roll Width:</span> {component.roll_width}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
