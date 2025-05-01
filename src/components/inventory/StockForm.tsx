
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { BasicInfoFields } from "./form/BasicInfoFields";
import { QuantityUnitFields } from "./form/QuantityUnitFields";
import { AlternateUnitFields } from "./form/AlternateUnitFields";
import { CostTrackingFields } from "./form/CostTrackingFields";
import { AdditionalInfoFields } from "./form/AdditionalInfoFields";
import { useStockForm } from "./form/useStockForm";

interface StockFormProps {
  stockId?: string;
}

export const StockForm = ({ stockId }: StockFormProps) => {
  const navigate = useNavigate();
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

  if (isLoading && stockId) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{stockId ? "Edit Stock Item" : "Add New Stock Item"}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <BasicInfoFields />

              {/* Quantity and Units */}
              <QuantityUnitFields
                hasAlternateUnit={hasAlternateUnit}
                onAlternateUnitChange={setHasAlternateUnit}
              />
            </div>

            {/* Alternate Unit Settings */}
            {hasAlternateUnit && (
              <>
                <Separator className="my-4" />
                <AlternateUnitFields />
              </>
            )}

            {/* Cost Tracking */}
            <Separator className="my-4" />
            <CostTrackingFields trackCost={trackCost} onTrackCostChange={setTrackCost} />

            {/* Additional Information */}
            <Separator className="my-4" />
            <h3 className="text-lg font-medium">Additional Information</h3>
            <AdditionalInfoFields suppliers={suppliers} />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory/stock")}
              >
                Cancel
              </Button>
              <Button type="submit">
                {stockId ? "Update Stock" : "Add Stock"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
