
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
import { AlertCircle, Link, Plus } from "lucide-react";

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
  onLinkMaterial?: (componentId: string) => void;
}

export const ComponentsTable = ({ 
  components, 
  onViewComponent,
  onLinkMaterial
}: ComponentsTableProps) => {
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
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-slate-50">
            <TableHead className="font-medium text-slate-600">Type</TableHead>
            <TableHead className="font-medium text-slate-600">Size</TableHead>
            <TableHead className="font-medium text-slate-600">Color</TableHead>
            <TableHead className="font-medium text-slate-600">GSM</TableHead>
            <TableHead className="font-medium text-slate-600">Material</TableHead>
            <TableHead className="text-right font-medium text-slate-600">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="rounded-full bg-slate-50 p-3">
                    <div className="h-6 w-6 text-slate-400">📦</div>
                  </div>
                  <div className="text-sm font-medium text-slate-600">No components found</div>
                  <div className="text-xs text-slate-400">Components will appear here once added</div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            components.map((component) => (
              <TableRow key={component.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-700">
                  {component.component_type === 'custom' 
                    ? `Custom (${component.custom_name})` 
                    : componentTypes[component.component_type as keyof typeof componentTypes]}
                </TableCell>
                <TableCell className="text-slate-600">{component.size || 'N/A'}</TableCell>
                <TableCell>
                  {component.color ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 w-4 rounded-full border border-slate-200" 
                        style={{ backgroundColor: component.color.toLowerCase() !== 'custom' ? component.color : '#ddd' }}
                      ></div>
                      <span className="text-slate-600">{component.color}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-600">{component.gsm || 'N/A'}</TableCell>
                <TableCell>
                  {component.material ? (
                    <Badge {...getMaterialBadgeProps(component)} className="flex items-center gap-1">
                      <Link className="h-3 w-3" />
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
                  ) : onLinkMaterial ? (
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 px-2 h-7 font-normal"
                      onClick={() => onLinkMaterial(component.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Link Material
                    </Button>
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
                    className="hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
