
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

interface CostTrackingFieldsProps {}

export const CostTrackingFields = ({}: CostTrackingFieldsProps) => {
  const { control, watch } = useFormContext();
  
  return (
    <>
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
    </>
  );
};
