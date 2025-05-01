
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

export const BasicInfoFields = () => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <FormField
        control={control}
        name="material_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Material Type</FormLabel>
            <FormControl>
              <Input placeholder="Fabric, Thread, Zipper, etc" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <Input placeholder="Red, Blue, Green, etc" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="gsm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>GSM</FormLabel>
            <FormControl>
              <Input placeholder="120, 250, etc" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
