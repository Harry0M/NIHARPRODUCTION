
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Component } from "@/types/order";
import { CuttingComponent, JobStatus } from "@/types/production";
import { ComponentStatusSelect } from "@/components/production/cutting/ComponentStatusSelect";
import { ComponentMeasurements } from "@/components/production/cutting/ComponentMeasurements";
import { ComponentNotes } from "@/components/production/cutting/ComponentNotes";
import { useEffect } from "react";

interface CuttingJobComponentFormProps {
  components: Component[];
  componentData: CuttingComponent[];
  handleComponentChange: (index: number, field: string, value: string | JobStatus) => void;
  handleGoBack: () => void;
  submitting: boolean;
  selectedJobId: string | null;
}

export function CuttingJobComponentForm({
  components,
  componentData,
  handleComponentChange,
  handleGoBack,
  submitting,
  selectedJobId
}: CuttingJobComponentFormProps) {
  const handleMeasurementChange = (index: number) => (field: string, value: string) => {
    handleComponentChange(index, field, value);
  };

  // Auto-fill width and height from component data if not already set
  useEffect(() => {
    components.forEach((component, index) => {
      // For components that haven't been initialized yet
      if (!componentData[index]?.width || componentData[index]?.width === "") {
        // Try to extract dimensions from size field if available
        if (component.size) {
          // Attempt to parse size for width (assuming format like '10x20' or similar)
          const sizeParts = component.size.split('x');
          if (sizeParts.length > 0 && !isNaN(Number(sizeParts[0]))) {
            handleComponentChange(index, "width", sizeParts[0].trim());
          }
        }
      }
      
      if (!componentData[index]?.height || componentData[index]?.height === "") {
        // Try to extract dimensions from size field if available
        if (component.size) {
          // Attempt to parse size for height (assuming format like '10x20' or similar)
          const sizeParts = component.size.split('x');
          if (sizeParts.length > 1 && !isNaN(Number(sizeParts[1]))) {
            handleComponentChange(index, "height", sizeParts[1].trim());
          }
        }
      }
    });
  }, [components, componentData, handleComponentChange]);

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle>Component Cutting Details</CardTitle>
        <CardDescription>Enter cutting details for each component</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {components.map((component, index) => (
            <div key={component.id} className="p-4 border rounded-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium capitalize">{component.component_type}</h3>
                <div className="flex items-center gap-2 text-sm">
                  {component.size && <span className="bg-slate-100 px-2 py-1 rounded">Size: {component.size}</span>}
                  {component.color && <span className="bg-slate-100 px-2 py-1 rounded">Color: {component.color}</span>}
                  {component.gsm && <span className="bg-slate-100 px-2 py-1 rounded">GSM: {component.gsm}</span>}
                </div>
              </div>

              <ComponentMeasurements
                width={componentData[index]?.width || ""}
                height={componentData[index]?.height || ""}
                counter={componentData[index]?.counter || ""}
                rewinding={componentData[index]?.rewinding || ""}
                materialName={component.inventory?.material_name || ""}
                rollWidth={component.roll_width?.toString() || ""}
                consumption={component.consumption?.toString() || ""}
                onMeasurementChange={handleMeasurementChange(index)}
              />

              <div className="space-y-2">
                <ComponentStatusSelect
                  status={componentData[index]?.status || "pending"}
                  onChange={(value) => handleComponentChange(index, "status", value)}
                />
              </div>

              <ComponentNotes
                notes={componentData[index]?.notes || ""}
                onChange={(value) => handleComponentChange(index, "notes", value)}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoBack}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="cutting-form"
          disabled={submitting}
        >
          {submitting ? "Saving..." : (selectedJobId ? "Update Cutting Job" : "Create Cutting Job")}
        </Button>
      </CardFooter>
    </Card>
  );
}
