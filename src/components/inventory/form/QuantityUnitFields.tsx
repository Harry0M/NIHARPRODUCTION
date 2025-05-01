
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

interface QuantityUnitFieldsProps {
  hasAlternateUnit: boolean;
  onAlternateUnitChange: (checked: boolean) => void;
}

export const QuantityUnitFields = ({
  hasAlternateUnit,
  onAlternateUnitChange,
}: QuantityUnitFieldsProps) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Quantity and Units</h3>
      <FormField
        control={control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                step="any"
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
        name="unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unit</FormLabel>
            <FormControl>
              <Input placeholder="meters, kg, pieces, etc" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-center space-x-2 mt-4">
        <Switch
          id="alternate-unit"
          checked={hasAlternateUnit}
          onCheckedChange={onAlternateUnitChange}
        />
        <label
          htmlFor="alternate-unit"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Use Alternate Unit
        </label>
      </div>
    </div>
  );
};
