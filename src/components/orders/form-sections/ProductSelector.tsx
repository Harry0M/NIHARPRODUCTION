
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  bag_length?: number;
  bag_width?: number;
  border_dimension?: number;
  default_rate?: number;
  catalog_components?: Array<{
    id: string;
    component_type: string;
    size?: string;
    color?: string;
    gsm?: number;
    custom_name?: string;
    roll_width?: number;
    length?: number;
    width?: number;
    consumption?: number;
    material_id?: string;
    material?: {
      id: string;
      material_type: string;
      color?: string;
      gsm?: string;
      quantity?: number;
      unit?: string;
    };
  }>;
}

interface ProductSelectorProps {
  catalogProducts: Product[] | undefined;
  isLoading: boolean;
  onProductSelect: (productId: string) => void;
}

export const ProductSelector = ({
  catalogProducts,
  isLoading,
  onProductSelect
}: ProductSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Select Product (Optional)</Label>
      <Select onValueChange={onProductSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a product template" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading products...</SelectItem>
          ) : (
            catalogProducts?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.bag_length}" × {product.bag_width}")
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
