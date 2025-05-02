
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  bag_length?: number;
  bag_width?: number;
  border_dimension?: number;
  default_rate?: number;
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
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading products...</SelectItem>
          ) : (
            catalogProducts?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
