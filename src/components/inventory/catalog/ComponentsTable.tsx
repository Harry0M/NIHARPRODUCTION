
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

export interface Material {
  id: string;
  material_type: string;
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
  material?: Material;
}

interface ComponentsTableProps {
  components: CatalogComponent[];
  onViewComponent: (componentId: string) => void;
}

export const ComponentsTable = ({ components, onViewComponent }: ComponentsTableProps) => {
  const componentTypes = {
    part: "Part",
    border: "Border",
    handle: "Handle",
    chain: "Chain",
    runner: "Runner",
    custom: "Custom"
  };

  // Helper to determine the badge style based on material status
  const getMaterialBadgeProps = (component: CatalogComponent) => {
    if (component.material) {
      return {
        variant: "outline" as const,
        className: "font-normal"
      };
    } else if (component.material_id && component.material_linked) {
      return {
        variant: "outline" as const,
        className: "font-normal bg-yellow-50 text-amber-800 border-amber-300"
      };
    } else if (component.material_id && !component.material_linked) {
      return {
        variant: "outline" as const,
        className: "font-normal bg-blue-50 text-blue-800 border-blue-300"
      };
    } else {
      return {
        variant: "outline" as const,
        className: "font-normal text-muted-foreground"
      };
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>GSM</TableHead>
          <TableHead>Material</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {components.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No components found
            </TableCell>
          </TableRow>
        ) : (
          components.map((component) => (
            <TableRow key={component.id}>
              <TableCell>
                {component.component_type === 'custom' 
                  ? `Custom (${component.custom_name})` 
                  : componentTypes[component.component_type as keyof typeof componentTypes]}
              </TableCell>
              <TableCell>{component.size || 'N/A'}</TableCell>
              <TableCell>{component.color || 'N/A'}</TableCell>
              <TableCell>{component.gsm || 'N/A'}</TableCell>
              <TableCell>
                {component.material ? (
                  <Badge {...getMaterialBadgeProps(component)}>
                    {component.material.material_type} 
                    {component.material.color ? ` - ${component.material.color}` : ''}
                    {component.material.gsm ? ` ${component.material.gsm}` : ''}
                  </Badge>
                ) : component.material_id && component.material_linked ? (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    <Badge {...getMaterialBadgeProps(component)}>
                      Material reference issue
                    </Badge>
                  </div>
                ) : component.material_id ? (
                  <Badge {...getMaterialBadgeProps(component)}>
                    Material ID: {component.material_id.substring(0, 8)}... (not linked)
                  </Badge>
                ) : (
                  <Badge {...getMaterialBadgeProps(component)}>
                    No material linked
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewComponent(component.id)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
