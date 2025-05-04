
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { predefinedColors } from "./StockFormSchema";

export const BasicInfoFields = () => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <FormField
        control={control}
        name="material_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Material Name</FormLabel>
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
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {predefinedColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      <span>{color}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
            {field.value === "custom" && (
              <Input 
                placeholder="Enter custom color" 
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
