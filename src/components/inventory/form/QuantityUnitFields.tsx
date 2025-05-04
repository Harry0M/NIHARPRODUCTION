
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allUnits } from "./StockFormSchema";

interface QuantityUnitFieldsProps {
  hasAlternateUnit: boolean;
  onAlternateUnitChange: (checked: boolean) => void;
}

export const QuantityUnitFields = ({
  hasAlternateUnit,
  onAlternateUnitChange,
}: QuantityUnitFieldsProps) => {
  const { control, formState } = useFormContext();

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
            <FormLabel className="flex items-center">
              Unit <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
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
