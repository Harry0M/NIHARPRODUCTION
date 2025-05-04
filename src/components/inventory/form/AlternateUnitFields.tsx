
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allUnits } from "./StockFormSchema";

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
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select alternate unit" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {allUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
            {field.value === "custom" && (
              <Input 
                placeholder="Enter custom unit" 
                className="mt-2"
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
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
                min="0"
                placeholder="1 primary unit = ? alternate units"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
