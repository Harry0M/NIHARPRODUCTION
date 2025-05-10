
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { QuantityFields } from "./form/QuantityFields";
import { DateFields } from "./form/DateFields";
import { WorkerFields } from "./form/WorkerFields";
import { StatusFields } from "./form/StatusFields";
import { NotesField } from "./form/NotesField";
import { stitchingFormSchema, StitchingFormValues } from "./form/types";
import { useEffect } from "react";

interface StitchingFormProps {
  defaultValues: StitchingFormValues;
  onSubmit: (values: StitchingFormValues) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  selectedJobId: string | null;
  totalPrintingQuantity?: number;
  remainingQuantity?: number;
  currentProvidedQuantity?: number;
}

export const StitchingForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  selectedJobId,
  totalPrintingQuantity = 0,
  remainingQuantity = 0,
  currentProvidedQuantity = 0
}: StitchingFormProps) => {
  const form = useForm<StitchingFormValues>({
    resolver: zodResolver(stitchingFormSchema),
    defaultValues
  });
  
  // Reset form when defaultValues change to ensure saved data is always displayed
  useEffect(() => {
    if (defaultValues) {
      console.log("Resetting form with values:", defaultValues);
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleFormSubmit = async (values: StitchingFormValues) => {
    console.log("Submitting form with values:", values);
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stitching Details</CardTitle>
            <CardDescription>Enter the stitching job specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <QuantityFields 
              form={form} 
              totalPrintingQuantity={totalPrintingQuantity} 
              remainingQuantity={remainingQuantity}
              selectedJobId={selectedJobId}
              currentProvidedQuantity={currentProvidedQuantity}
            />
            <DateFields form={form} />
            <NotesField form={form} />
            <WorkerFields form={form} />
            <StatusFields form={form} />
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : selectedJobId ? "Update Job" : "Create Job"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
