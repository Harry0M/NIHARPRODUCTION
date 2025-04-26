
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, User } from "lucide-react";

interface RecipientFormProps {
  recipientName: string;
  trackingNumber: string;
  deliveryAddress: string;
  notes: string;
  onFieldChange: (field: string, value: string) => void;
}

export const RecipientForm = ({
  recipientName,
  trackingNumber,
  deliveryAddress,
  notes,
  onFieldChange,
}: RecipientFormProps) => {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipient_name" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Recipient Name
          </Label>
          <Input
            id="recipient_name"
            name="recipient_name"
            value={recipientName}
            onChange={(e) => onFieldChange('recipient_name', e.target.value)}
            placeholder="Enter recipient name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tracking_number" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Tracking Number (optional)
          </Label>
          <Input
            id="tracking_number"
            name="tracking_number"
            value={trackingNumber}
            onChange={(e) => onFieldChange('tracking_number', e.target.value)}
            placeholder="Enter tracking number if available"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery_address">Delivery Address</Label>
        <Textarea
          id="delivery_address"
          name="delivery_address"
          value={deliveryAddress}
          onChange={(e) => onFieldChange('delivery_address', e.target.value)}
          placeholder="Enter complete delivery address"
          required
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Add any additional dispatch notes"
          rows={2}
        />
      </div>
    </>
  );
};
