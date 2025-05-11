
import React, { useState } from "react";
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
  const { control, formState } = useFormContext();
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColorValue, setCustomColorValue] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <FormField
        control={control}
        name="material_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              Material Name <span className="text-red-500 ml-1">*</span>
            </FormLabel>
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
              onValueChange={(value) => {
                if (value === "custom") {
                  setIsCustomColor(true);
                  // Keep the field value as it is, we'll update it when custom color is entered
                } else {
                  setIsCustomColor(false);
                  setCustomColorValue("");
                  field.onChange(value);
                }
              }}
              value={isCustomColor ? "custom" : (field.value || "")}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color">
                    {isCustomColor ? customColorValue || "Custom..." : field.value}
                  </SelectValue>
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
            {isCustomColor && (
              <Input 
                placeholder="Enter custom color" 
                className="mt-2"
                value={customColorValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomColorValue(value);
                  field.onChange(value); // Update the actual form field with the custom color value
                }}
              />
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Removed GSM field as requested */}
    </div>
  );
};
