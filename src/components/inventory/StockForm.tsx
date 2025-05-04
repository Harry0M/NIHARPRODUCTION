
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BasicInfoFields } from "./form/BasicInfoFields";
import { QuantityUnitFields } from "./form/QuantityUnitFields";
import { AlternateUnitFields } from "./form/AlternateUnitFields";
import { CostTrackingFields } from "./form/CostTrackingFields";
import { AdditionalInfoFields } from "./form/AdditionalInfoFields";
import { useStockForm } from "./form/useStockForm";
import { Loader2 } from "lucide-react";

interface StockFormProps {
  stockId?: string;
}

export const StockForm = ({ stockId }: StockFormProps) => {
  const {
    form,
    onSubmit,
    suppliers,
    hasAlternateUnit,
    setHasAlternateUnit,
    trackCost,
    setTrackCost,
    isLoading,
  } = useStockForm({ stockId });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {stockId ? "Edit Stock" : "Add New Stock"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <BasicInfoFields />
                </div>
                <div>
                  <QuantityUnitFields
                    hasAlternateUnit={hasAlternateUnit}
                    onAlternateUnitChange={setHasAlternateUnit}
                  />

                  {hasAlternateUnit && <AlternateUnitFields />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <CostTrackingFields
                    trackCost={trackCost}
                    onTrackCostChange={setTrackCost}
                  />
                </div>
                <div>
                  <AdditionalInfoFields suppliers={suppliers} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="ml-auto"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {stockId ? "Update Stock" : "Save Stock"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
};
