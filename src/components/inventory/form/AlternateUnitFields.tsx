
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const AlternateUnitFields = () => {
  const { control, watch } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="alternate_unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alternate Unit</FormLabel>
            <FormControl>
              <Input placeholder="yards, pieces, etc" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="conversion_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Conversion Rate</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder="1 primary unit = ? alternate units"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
              />
            </FormControl>
            <FormDescription>
              1 {watch("unit")} = {watch("conversion_rate")} {watch("alternate_unit")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
