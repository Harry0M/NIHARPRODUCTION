
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CuttingComponent, JobStatus } from "@/types/production";
import { ComponentStatusSelect } from "@/components/production/cutting/ComponentStatusSelect";
import { ComponentMeasurements } from "@/components/production/cutting/ComponentMeasurements";
import { ComponentNotes } from "@/components/production/cutting/ComponentNotes";

interface CuttingJobComponentFormProps {
  components: any[];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Cutting Details</CardTitle>
        <CardDescription>Enter cutting details for each component</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {components.map((component, index) => {
            // Make sure we have component data for this index
            const currentComponentData = componentData[index] || {
              component_id: component.id,
              width: "",
              height: "",
              counter: "",
              rewinding: "",
              rate: "",
              status: "pending" as JobStatus,
              notes: ""
            };
            
            return (
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
                  width={currentComponentData.width || ""}
                  height={currentComponentData.height || ""}
                  counter={currentComponentData.counter || ""}
                  rewinding={currentComponentData.rewinding || ""}
                  onMeasurementChange={handleMeasurementChange(index)}
                />

                <div className="space-y-2">
                  <ComponentStatusSelect
                    status={currentComponentData.status || "pending"}
                    onChange={(value) => handleComponentChange(index, "status", value)}
                  />
                </div>

                <ComponentNotes
                  notes={currentComponentData.notes || ""}
                  onChange={(value) => handleComponentChange(index, "notes", value)}
                />
              </div>
            );
          })}

          {components.length === 0 && (
            <div className="text-center p-6 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No components found for this order.</p>
            </div>
          )}
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
