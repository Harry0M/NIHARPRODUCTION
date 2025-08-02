
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { StitchingFormValues } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface QuantityFieldsProps {
  form: UseFormReturn<StitchingFormValues>;
  totalPrintingQuantity?: number;
  remainingQuantity?: number;
  selectedJobId?: string | null;
  currentProvidedQuantity?: number;
}

export const QuantityFields = ({ 
  form, 
  totalPrintingQuantity = 0, 
  remainingQuantity = 0,
  selectedJobId = null,
  currentProvidedQuantity = 0
}: QuantityFieldsProps) => {
  const [localRemainingQuantity, setLocalRemainingQuantity] = useState(remainingQuantity);
  const providedQuantity = form.watch("provided_quantity");

  // Update available quantity as the user types
  useEffect(() => {
    if (selectedJobId) {
      // If editing, we need to include the current job's quantity in the calculation
      setLocalRemainingQuantity(remainingQuantity + currentProvidedQuantity - (providedQuantity || 0));
    } else {
      // If creating a new job, just subtract from remaining
      setLocalRemainingQuantity(remainingQuantity - (providedQuantity || 0));
    }
  }, [providedQuantity, remainingQuantity, selectedJobId, currentProvidedQuantity]);

  const quantityFields = [
    { name: "provided_quantity" as const, label: "Provided Quantity" },
    { name: "part_quantity" as const, label: "Part Quantity" },
    { name: "border_quantity" as const, label: "Border Quantity" },
    { name: "handle_quantity" as const, label: "Handle Quantity" },
    { name: "chain_quantity" as const, label: "Chain Quantity" },
    { name: "runner_quantity" as const, label: "Runner Quantity" },
    { name: "piping_quantity" as const, label: "Piping Quantity" },
    { name: "received_quantity" as const, label: "Received Quantity" },
  ];

  return (
    <>
      <div className="space-y-4">
        {totalPrintingQuantity > 0 && (
          <Card className="bg-primary/5 border-primary">
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

        {totalPrintingQuantity > 0 && (
          <Card className={`${localRemainingQuantity >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg font-semibold ${localRemainingQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {localRemainingQuantity >= 0 ? 'Available Quantity' : 'Quantity Exceeded'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Remaining quantity available for allocation</p>
                </div>
                <div className={`text-2xl font-bold ${localRemainingQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {localRemainingQuantity}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {providedQuantity > 0 && localRemainingQuantity < 0 && (
          <Alert variant="destructive">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              You're allocating more quantity than what's available from printing jobs.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {quantityFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className={field.name === "received_quantity" ? "text-red-600 font-medium" : ""}>
                  {field.label}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`${field.label}`}
                    {...formField}
                    value={formField.value === null ? '' : formField.value}
                    onChange={e => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      formField.onChange(value);
                    }}
                    className={
                      field.name === "provided_quantity" && localRemainingQuantity < 0 
                        ? "border-red-500" 
                        : field.name === "received_quantity" 
                        ? "border-red-500 focus:border-red-600 focus:ring-red-500" 
                        : ""
                    }
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
