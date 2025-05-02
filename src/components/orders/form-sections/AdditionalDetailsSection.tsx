
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderFormData } from "@/types/order";

interface AdditionalDetailsSectionProps {
  formData: OrderFormData;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const AdditionalDetailsSection = ({
  formData,
  handleOrderChange
}: AdditionalDetailsSectionProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="rate">Rate per Bag</Label>
        <Input 
          id="rate" 
          name="rate"
          type="number"
          step="0.01"
          value={formData.rate}
          onChange={handleOrderChange}
          placeholder="Price per bag"
          min="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="special_instructions">Special Instructions (optional)</Label>
        <Textarea 
          id="special_instructions" 
          name="special_instructions"
          value={formData.special_instructions}
          onChange={handleOrderChange}
          placeholder="Any additional notes or requirements"
          rows={3}
        />
      </div>
    </div>
  );
};
