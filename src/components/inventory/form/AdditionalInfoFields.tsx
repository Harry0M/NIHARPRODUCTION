
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

interface Supplier {
  id: string;
  name: string;
}

interface AdditionalInfoFieldsProps {
  suppliers: Supplier[] | undefined;
}

export const AdditionalInfoFields = ({ suppliers }: AdditionalInfoFieldsProps) => {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="supplier_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Supplier</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="reorder_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reorder Level</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="any"
                min="0"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>Minimum quantity before reordering</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
