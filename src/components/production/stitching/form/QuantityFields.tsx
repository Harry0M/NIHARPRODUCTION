
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { StitchingFormValues } from "./types";
import { Card, CardContent } from "@/components/ui/card";

interface QuantityFieldsProps {
  form: UseFormReturn<StitchingFormValues>;
  totalPrintingQuantity?: number;
}

export const QuantityFields = ({ form, totalPrintingQuantity = 0 }: QuantityFieldsProps) => {
  const quantityFields = [
    { name: "received_quantity" as const, label: "Received Quantity" },
    { name: "provided_quantity" as const, label: "Provided Quantity" },
    { name: "part_quantity" as const, label: "Part Quantity" },
    { name: "border_quantity" as const, label: "Border Quantity" },
    { name: "handle_quantity" as const, label: "Handle Quantity" },
    { name: "chain_quantity" as const, label: "Chain Quantity" },
    { name: "runner_quantity" as const, label: "Runner Quantity" },
    { name: "piping_quantity" as const, label: "Piping Quantity" },
  ];

  return (
    <>
      {totalPrintingQuantity > 0 && (
        <Card className="bg-primary/5 border-primary mb-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-primary">Total Printing Quantity</h3>
                <p className="text-sm text-muted-foreground">Combined received quantity from printing jobs</p>
              </div>
              <div className="text-2xl font-bold text-primary">{totalPrintingQuantity}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quantityFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`${field.label}`}
                    {...formField}
                    value={formField.value === null ? '' : formField.value}
                    onChange={e => formField.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </>
  );
};
