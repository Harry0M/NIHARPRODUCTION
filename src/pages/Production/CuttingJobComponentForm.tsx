
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Component } from "@/types/order";
import { CuttingComponent, JobStatus } from "@/types/production";

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
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Input
                    type="text"
                    placeholder="Material type"
                    value={componentData[index]?.material_type || ""}
                    onChange={(e) => handleComponentChange(index, "material_type", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Material Color</Label>
                  <Input
                    type="text"
                    placeholder="Material color"
                    value={componentData[index]?.material_color || ""}
                    onChange={(e) => handleComponentChange(index, "material_color", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Material GSM</Label>
                  <Input
                    type="number"
                    placeholder="Material GSM"
                    value={componentData[index]?.material_gsm || ""}
                    onChange={(e) => handleComponentChange(index, "material_gsm", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Input
                    type="text"
                    placeholder="Width"
                    value={componentData[index]?.width || ""}
                    onChange={(e) => handleComponentChange(index, "width", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Input
                    type="text"
                    placeholder="Height"
                    value={componentData[index]?.height || ""}
                    onChange={(e) => handleComponentChange(index, "height", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Counter</Label>
                  <Input
                    type="text"
                    placeholder="Counter"
                    value={componentData[index]?.counter || ""}
                    onChange={(e) => handleComponentChange(index, "counter", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rewinding</Label>
                  <Input
                    type="text"
                    placeholder="Rewinding"
                    value={componentData[index]?.rewinding || ""}
                    onChange={(e) => handleComponentChange(index, "rewinding", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Input
                    type="text"
                    placeholder="Rate"
                    value={componentData[index]?.rate || ""}
                    onChange={(e) => handleComponentChange(index, "rate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={componentData[index]?.status || "pending"}
                    onValueChange={(value: JobStatus) => handleComponentChange(index, "status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any notes about the cutting process"
                  value={componentData[index]?.notes || ""}
                  onChange={(e) => handleComponentChange(index, "notes", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
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
