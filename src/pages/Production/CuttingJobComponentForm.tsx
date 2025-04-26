
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type JobStatus = "pending" | "in_progress" | "completed";
interface Component {
  id: string;
  type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
}
interface CuttingComponent {
  component_id: string;
  type: string;
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  rate: string;
  status: JobStatus;
}
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
                <h3 className="text-lg font-medium capitalize">{component.type}</h3>
                <div className="flex items-center gap-2 text-sm">
                  {component.size && <span className="bg-slate-100 px-2 py-1 rounded">Size: {component.size}</span>}
                  {component.color && <span className="bg-slate-100 px-2 py-1 rounded">Color: {component.color}</span>}
                  {component.gsm && <span className="bg-slate-100 px-2 py-1 rounded">GSM: {component.gsm}</span>}
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
