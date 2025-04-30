
import { 
  Tag, 
  Palette, 
  Ruler, 
  Scale, 
  ArrowLeft, 
  Calendar 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface StockBasicInfoProps {
  inventory: {
    material_type: string;
    color?: string;
    gsm?: string;
    quantity: number;
    unit: string;
    reorder_level?: number;
    alternate_unit?: string;
    conversion_rate?: number;
    created_at: string;
  };
}

export const StockBasicInfo = ({ inventory }: StockBasicInfoProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium">Basic Information</h3>
      <Separator className="my-2" />
      <div className="space-y-2">
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium mr-2">Material Type:</span>
          <span>{inventory.material_type}</span>
        </div>
        {inventory.color && (
          <div className="flex items-center">
            <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium mr-2">Color:</span>
            <span>{inventory.color}</span>
          </div>
        )}
        {inventory.gsm && (
          <div className="flex items-center">
            <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium mr-2">GSM:</span>
            <span>{inventory.gsm}</span>
          </div>
        )}
        <div className="flex items-center">
          <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium mr-2">Quantity:</span>
          <span>{inventory.quantity} {inventory.unit}</span>
          {inventory.reorder_level && inventory.quantity <= inventory.reorder_level && (
            <Badge variant="destructive" className="ml-2">Low Stock</Badge>
          )}
        </div>
        {inventory.alternate_unit && (
          <div className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium mr-2">Alternate Unit:</span>
            <span>
              {inventory.alternate_unit} (1 {inventory.unit} = {inventory.conversion_rate} {inventory.alternate_unit})
            </span>
          </div>
        )}
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium mr-2">Created At:</span>
          <span>{new Date(inventory.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
