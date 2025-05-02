
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
                  <Badge variant="outline" className="font-normal">
                    {component.material.material_type} 
                    {component.material.color ? ` - ${component.material.color}` : ''}
                    {component.material.gsm ? ` ${component.material.gsm}` : ''}
                  </Badge>
                ) : component.material_id ? (
                  <Badge variant="outline" className="font-normal bg-yellow-50">
                    Material ID: {component.material_id.substring(0, 8)}...
                  </Badge>
                ) : (
                  'No material linked'
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
