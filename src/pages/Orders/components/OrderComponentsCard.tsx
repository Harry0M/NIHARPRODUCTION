
import { NavigateFunction } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { ComponentData } from "@/types/order";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

interface OrderComponentsCardProps {
  components: Record<string, ComponentData>;
  customComponents: ComponentData[];
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  navigate: NavigateFunction;
  submitting: boolean;
}

export const OrderComponentsCard = ({
  components,
  customComponents,
  handleComponentChange,
  handleCustomComponentChange,
  addCustomComponent,
  removeCustomComponent,
  navigate,
  submitting
}: OrderComponentsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bag Components</CardTitle>
        <CardDescription>Specify the details for each component of the bag</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <StandardComponents 
            components={components}
            componentOptions={componentOptions}
            onChange={handleComponentChange}
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Custom Components</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={addCustomComponent}
              >
                + Add Custom Component
              </Button>
            </div>
            
            <CustomComponentSection
              customComponents={customComponents}
              componentOptions={componentOptions}
              handleCustomComponentChange={handleCustomComponentChange}
              removeCustomComponent={removeCustomComponent}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/orders")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
