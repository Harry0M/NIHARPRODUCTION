
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { Plus } from "lucide-react";

interface OrderEditFormProps {
  formData: any;
  formErrors: any;
  components: any[];
  customComponents: any[];
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  submitting: boolean;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleComponentChange: (index: number, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  formData,
  formErrors,
  components,
  customComponents,
  componentOptions,
  submitting,
  handleOrderChange,
  handleComponentChange,
  handleCustomComponentChange,
  addCustomComponent,
  removeCustomComponent,
  handleSubmit,
  onCancel
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <OrderDetailsForm 
        formData={formData}
        handleOrderChange={handleOrderChange}
        formErrors={formErrors}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Bag Components</CardTitle>
          <CardDescription>Specify the details for each bag component</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {components.map((component, index) => (
              <div key={index} className="p-4 border rounded-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium capitalize">{component.type}</h3>
                </div>
                <ComponentForm
                  component={component}
                  index={index}
                  componentOptions={componentOptions}
                  handleChange={handleComponentChange}
                />
              </div>
            ))}
            
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
                  <Plus size={16} />
                  Add Custom Component
                </Button>
              </div>

              <CustomComponentSection
                components={customComponents}
                onChange={handleCustomComponentChange}
                onRemove={removeCustomComponent}
                componentOptions={componentOptions}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Order"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
