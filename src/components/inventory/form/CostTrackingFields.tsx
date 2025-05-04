
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface CostTrackingFieldsProps {
  trackCost: boolean;
  onTrackCostChange: (checked: boolean) => void;
}

export const CostTrackingFields = ({
  trackCost,
  onTrackCostChange,
}: CostTrackingFieldsProps) => {
  const { control, watch } = useFormContext();
  
  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <Switch id="cost-tracking" checked={trackCost} onCheckedChange={onTrackCostChange} />
        <label
          htmlFor="cost-tracking"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Enable Cost Tracking
        </label>
      </div>

      {/* Purchase Rate field (always visible) */}
      <FormField
        control={control}
        name="purchase_rate"
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Purchase Rate (per {watch("unit")})</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="any"
                min="0"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {trackCost && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price (per {watch("unit")})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="selling_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (per {watch("unit")})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  );
};
