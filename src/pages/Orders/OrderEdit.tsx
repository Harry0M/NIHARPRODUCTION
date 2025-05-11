import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { v4 as uuidv4 } from "uuid";
import { OrderFormData } from "@/types/order";
import { validateComponentData, convertStringToNumeric } from "@/utils/orderFormUtils";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
};

interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
  product_quantity?: string;
  total_quantity?: string;
}

const OrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    product_quantity: "1", // Default to 1
    total_quantity: "", // Will be calculated
    bag_length: "",
    bag_width: "",
    border_dimension: "",
    rate: "",
    special_instructions: "",
    order_date: "",
    sales_account_id: null
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<any[]>([]);
  const [baseConsumptions, setBaseConsumptions] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();
          
        if (orderError) throw orderError;
        
        // Format order data for the form
        setFormData({
          company_name: orderData.company_name || "",
          company_id: orderData.company_id,
          quantity: orderData.quantity?.toString() || "",
          product_quantity: "1", // Default to 1 initially
          total_quantity: orderData.quantity?.toString() || "", // Initially same as quantity
          bag_length: orderData.bag_length?.toString() || "",
          bag_width: orderData.bag_width?.toString() || "",
          border_dimension: orderData.border_dimension?.toString() || "",
          rate: orderData.rate ? orderData.rate.toString() : "",
          special_instructions: orderData.special_instructions || "",
          order_date: new Date(orderData.order_date).toISOString().split('T')[0],
          sales_account_id: orderData.sales_account_id
        });
        
        // Check if the order has a catalog_id (product)
        if (orderData.catalog_id) {
          // Could potentially fetch catalog details here
        }
        
        // Fetch order components - now using order_components table
        const { data: componentsData, error: componentsError } = await supabase
          .from("order_components")
          .select("*")
          .eq("order_id", id);
          
        if (componentsError) throw componentsError;
        
        console.log("Fetched components:", componentsData);
        
        // Process components
        const standardComponents: Record<string, any> = {};
        const fetchedCustomComponents: any[] = [];
        const fetchedBaseConsumptions: Record<string, number> = {};
        
        if (componentsData && componentsData.length > 0) {
          componentsData.forEach(comp => {
            // Extract size information
            let length = "", width = "";
            if (comp.size) {
              const sizeParts = comp.size.split('x');
              if (sizeParts.length >= 2) {
                length = sizeParts[0] || "";
                width = sizeParts[1] || "";
              }
            }
            
            const componentData = {
              id: comp.id,
              type: comp.component_type,
              color: comp.color || "",
              gsm: comp.gsm?.toString() || "",
              length,
              width,
              roll_width: comp.roll_width?.toString() || "",
              consumption: comp.consumption?.toString() || "",
              material_id: comp.material_id || null,
              customName: comp.custom_name || ""
            };
            
            // Extract any base consumption values
            if (comp.consumption) {
              const consumption = parseFloat(comp.consumption.toString());
              if (!isNaN(consumption) && orderData.quantity > 0) {
                const baseConsumption = consumption / orderData.quantity;
                fetchedBaseConsumptions[comp.component_type] = baseConsumption;
              }
            }
            
            // Check if it's a standard component or custom
            if (comp.component_type === 'custom') {
              fetchedCustomComponents.push({
                ...componentData,
                id: comp.id || uuidv4(),
                customName: comp.custom_name || ""
              });
            } else {
              // Using original component types (with capitalization) for UI
              const uiComponentType = comp.component_type.charAt(0).toUpperCase() + comp.component_type.slice(1);
              standardComponents[uiComponentType] = componentData;
            }
          });
        }
        
        setComponents(standardComponents);
        setCustomComponents(fetchedCustomComponents);
        setBaseConsumptions(fetchedBaseConsumptions);
        
      } catch (error: any) {
        toast({
          title: "Error fetching order details",
          description: error.message,
          variant: "destructive"
        });
        // Use window.location.href for full page refresh
        window.location.href = "/orders";
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id, navigate]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
    const { name, value } = e.target;
    
    // Handle special case for sales_account_id
    if (name === 'sales_account_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'none' ? null : value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error when field is changed
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // If quantity or product_quantity changed, calculate total quantity and update consumption
    if ((name === 'quantity' || name === 'product_quantity') && value) {
      const orderQty = name === 'quantity' 
        ? parseFloat(value as string) 
        : parseFloat(formData.quantity || "1");
      
      const productQty = name === 'product_quantity' 
        ? parseFloat(value as string) 
        : parseFloat(formData.product_quantity || "1");
      
      if (!isNaN(orderQty) && !isNaN(productQty)) {
        const totalQty = orderQty * productQty;
        
        // Update total quantity
        setFormData(prev => ({
          ...prev,
          total_quantity: totalQty.toString()
        }));
        
        // Update consumption based on total quantity
        updateConsumptionBasedOnQuantity(totalQty);
      }
    }
  };

  const updateConsumptionBasedOnQuantity = (quantity: number) => {
    if (isNaN(quantity) || quantity <= 0) return;

    console.log(`Updating consumption based on quantity: ${quantity}`);
    console.log("Base consumptions:", baseConsumptions);

    // Update consumption for standard components
    const updatedComponents = { ...components };
    Object.keys(updatedComponents).forEach(type => {
      const baseConsumption = baseConsumptions[type.toLowerCase()];
      if (baseConsumption && !isNaN(baseConsumption)) {
        const newConsumption = baseConsumption * quantity;
        updatedComponents[type] = {
          ...updatedComponents[type],
          baseConsumption: baseConsumption.toFixed(2),
          consumption: newConsumption.toFixed(2)
        };
      }
    });
    setComponents(updatedComponents);

    // Update consumption for custom components
    const updatedCustomComponents = customComponents.map((component, idx) => {
      const baseConsumption = baseConsumptions[`custom_${idx}`] || baseConsumptions['custom'];
      if (baseConsumption && !isNaN(baseConsumption)) {
        const newConsumption = baseConsumption * quantity;
        return {
          ...component,
          baseConsumption: baseConsumption.toFixed(2),
          consumption: newConsumption.toFixed(2)
        };
      }
      return component;
    });
    setCustomComponents(updatedCustomComponents);
  };

  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      return {
        ...prev,
        [type]: {
          ...component,
          [field]: value
        }
      };
    });
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "" 
      }
    ]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate company information
    if (!formData.company_name) {
      errors.company = "Company name is required";
      isValid = false;
    }

    // Validate quantity
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
      isValid = false;
    }

    // Validate product quantity
    if (!formData.product_quantity || parseFloat(formData.product_quantity) <= 0) {
      errors.product_quantity = "Valid product quantity is required";
      isValid = false;
    }

    // Validate total quantity
    if (!formData.total_quantity || parseFloat(formData.total_quantity) <= 0) {
      errors.total_quantity = "Valid total quantity is required";
      isValid = false;
    }

    // Validate bag length
    if (!formData.bag_length || parseFloat(formData.bag_length) <= 0) {
      errors.bag_length = "Valid bag length is required";
      isValid = false;
    }

    // Validate bag width
    if (!formData.bag_width || parseFloat(formData.bag_width) <= 0) {
      errors.bag_width = "Valid bag width is required";
      isValid = false;
    }

    // Validate order date
    if (!formData.order_date) {
      errors.order_date = "Order date is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };
  
  // Helper function to convert string values to appropriate types
  const convertStringToNumeric = (value: string | undefined | null): number | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const numValue = parseFloat(value);
    return isNaN(numValue) ? null : numValue;
  };
  
  // Helper function to validate component data
  const validateComponentData = (component: any): boolean => {
    if (!component) {
      console.warn("Invalid component data: component is null or undefined");
      return false;
    }
    
    // Check for required type field (using either type or component_type)
    if (!component.type) {
      console.warn("Invalid component data: missing type", component);
      return false;
    }
    
    // Validate numeric fields to ensure they're not NaN when parsed
    if (component.length && isNaN(parseFloat(component.length))) {
      console.warn("Invalid component data: length is not a valid number", component);
      return false;
    }
    
    if (component.width && isNaN(parseFloat(component.width))) {
      console.warn("Invalid component data: width is not a valid number", component);
      return false;
    }
    
    if (component.roll_width && isNaN(parseFloat(component.roll_width))) {
      console.warn("Invalid component data: roll_width is not a valid number", component);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Form validation failed",
        description: "Please correct the highlighted fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          company_name: formData.company_id ? null : formData.company_name,
          company_id: formData.company_id,
          quantity: parseInt(formData.total_quantity), // Use total quantity instead of order quantity
          bag_length: parseFloat(formData.bag_length),
          bag_width: parseFloat(formData.bag_width),
          border_dimension: formData.border_dimension ? parseFloat(formData.border_dimension) : null,
          rate: formData.rate ? parseFloat(formData.rate) : null,
          special_instructions: formData.special_instructions || null,
          order_date: formData.order_date,
          sales_account_id: formData.sales_account_id
        })
        .eq("id", id);
      
      if (orderError) throw orderError;
      
      // Delete existing components and recreate them
      const { error: deleteError } = await supabase
        .from("order_components")
        .delete()
        .eq("order_id", id);
      
      if (deleteError) throw deleteError;
      
      // Process and insert updated components
      const allComponents = [
        ...Object.values(components).filter(comp => 
          comp.length || comp.width || comp.color || comp.gsm || comp.material_id
        ),
        ...customComponents.filter(comp => 
          comp.length || comp.width || comp.color || comp.gsm || comp.material_id || comp.customName
        )
      ];

      console.log("Components to save:", allComponents);

      if (allComponents.length > 0) {
        // Create a properly formatted array of components with correct data types
        const componentsToInsert = allComponents
          .filter(comp => validateComponentData(comp))
          .map(comp => {
            // Convert component type to lowercase for database
            const componentTypeRaw = comp.type === 'custom' ? 'custom' : comp.type;
            const componentType = componentTypeRaw.toLowerCase();
            
            // Use proper size formatting or null
            const size = comp.length && comp.width 
              ? `${comp.length}x${comp.width}` 
              : null;
            
            // Get the appropriate custom name based on component type
            const customName = comp.type === 'custom' ? comp.customName : null;
            
            // Convert string values to appropriate types for numeric fields
            const gsmValue = convertStringToNumeric(comp.gsm);
            const rollWidthValue = convertStringToNumeric(comp.roll_width);
            const consumptionValue = convertStringToNumeric(comp.consumption);
            
            return {
              order_id: id,
              component_type: componentType,
              size,
              color: comp.color || null,
              gsm: gsmValue,
              custom_name: customName,
              material_id: comp.material_id || null,
              roll_width: rollWidthValue,
              consumption: consumptionValue
            };
        });

        console.log("Formatted components to insert:", componentsToInsert);

        if (componentsToInsert.length > 0) {
          const { data: insertedComponents, error: componentsError } = await supabase
            .from("order_components")
            .insert(componentsToInsert)
            .select();
          
          if (componentsError) {
            console.error("Error saving components:", componentsError);
            console.error("Components that failed to save:", componentsToInsert);
            
            toast({
              title: "Error saving components",
              description: componentsError.message,
              variant: "destructive"
            });
          } else {
            console.log("Components saved successfully:", insertedComponents);
            
            toast({
              title: "Components saved successfully",
              description: `${insertedComponents?.length || 0} components saved`
            });
          }
        } else {
          console.warn("No valid components to insert after validation");
        }
      }

      toast({
        title: "Order Updated",
        description: "The order has been updated successfully",
      });
      
      // Use window.location.href for full page refresh
      window.location.href = `/orders/${id}`;
      
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductSelect = async (components: any[]) => {
    if (!components || components.length === 0) {
      console.log("No components to process");
      return;
    }
    
    // Define standard types in lowercase for case-insensitive comparison
    const standardTypesLower = ['part', 'border', 'handle', 'chain', 'runner', 'piping'];
    const newOrderComponents: Record<string, any> = {};
    const newCustomComponents: any[] = [];
    const newBaseConsumptions: Record<string, number> = {};

    // Extract all material_ids that need to be fetched
    const materialIds = components
      .filter(comp => comp.material_id)
      .map(comp => comp.material_id);

    let materialsData: Record<string, any> = {};
    
    // Fetch complete material data for all components with material_id
    if (materialIds.length > 0) {
      try {
        const { data: materials, error } = await supabase
          .from('inventory')
          .select('id, material_name, color, gsm, unit, roll_width')
          .in('id', materialIds);
          
        if (error) {
          console.error('Error fetching materials:', error);
          toast({
            title: "Error fetching materials",
            description: error.message,
            variant: "destructive"
          });
        } else if (materials) {
          materialsData = materials.reduce((acc, material) => {
            acc[material.id] = material;
            return acc;
          }, {} as Record<string, any>);
        }
      } catch (err) {
        console.error('Error in material fetch:', err);
      }
    }

    // Get product default quantity if available from first component
    // This assumes all components from the same product have the same default_quantity
    const productQuantity = components[0]?.default_quantity || 1;
    console.log(`Product default quantity: ${productQuantity}`);
    
    // Update product_quantity in formData
    setFormData(prev => {
      const newDetails = {
        ...prev,
        product_quantity: productQuantity.toString()
      };
      
      // Calculate total quantity if order quantity is already set
      if (prev.quantity) {
        const orderQty = parseFloat(prev.quantity);
        if (!isNaN(orderQty)) {
          newDetails.total_quantity = (orderQty * productQuantity).toString();
        }
      }
      
      return newDetails;
    });

    components.forEach(component => {
      if (!component) return;
      
      // Extract length and width from size format "length x width"
      let length = '', width = '';
      if (component.size) {
        const sizeValues = component.size.split('x').map((s: string) => s.trim());
        if (sizeValues.length >= 2) {
          length = sizeValues[0] || '';
          width = sizeValues[1] || '';
        }
      } else {
        // If no size but separate length/width provided
        length = component.length?.toString() || '';
        width = component.width?.toString() || '';
      }
      
      // Get consumption value directly from component
      let consumption = component.consumption?.toString() || '';
      const rollWidth = component.roll_width?.toString() || '';
      
      // If consumption isn't available, calculate it
      if (!consumption && length && width && rollWidth) {
        const lengthVal = parseFloat(length);
        const widthVal = parseFloat(width);
        const rollWidthVal = parseFloat(rollWidth);
        
        if (!isNaN(lengthVal) && !isNaN(widthVal) && !isNaN(rollWidthVal) && rollWidthVal > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          const calculatedConsumption = (lengthVal * widthVal) / (rollWidthVal * 39.39);
          consumption = calculatedConsumption.toFixed(2);
        }
      }
      
      // Include material_id if available
      const materialId = component.material_id || null;
      
      // Get material details either from fetched data or component
      let materialColor = '';
      let materialGsm = '';
      let materialRollWidth = '';
      
      if (materialId && materialsData[materialId]) {
        // If we have fetched material data, use it
        materialColor = materialsData[materialId].color || '';
        materialGsm = materialsData[materialId].gsm?.toString() || '';
        materialRollWidth = materialsData[materialId].roll_width?.toString() || rollWidth;
      } else {
        // Fallback to component data
        materialColor = component.material?.color || component.color || '';
        materialGsm = component.material?.gsm?.toString() || component.gsm?.toString() || '';
      }
      
      // Make sure component_type exists and is a string before converting to lower case
      if (!component.component_type || typeof component.component_type !== 'string') {
        return;
      }
      
      const componentTypeLower = component.component_type.toLowerCase();
      
      // Extract the base consumption value (before multiplication)
      const baseConsumption = consumption ? parseFloat(consumption) / productQuantity : undefined;
      
      if (componentTypeLower === 'custom') {
        const customIndex = newCustomComponents.length;
        newCustomComponents.push({
          id: uuidv4(),
          type: 'custom',
          customName: component.custom_name || '',
          color: materialColor,
          gsm: materialGsm,
          length,
          width,
          consumption,
          baseConsumption: baseConsumption?.toString(),
          roll_width: materialRollWidth || rollWidth,
          material_id: materialId
        });
        
        // Store base consumption for this custom component
        if (baseConsumption) {
          newBaseConsumptions[`custom_${customIndex}`] = baseConsumption;
        }
      } else if (standardTypesLower.includes(componentTypeLower)) {
        // Map the component type to the capitalized version used in the UI
        const componentTypeKey = component.component_type.charAt(0).toUpperCase() + component.component_type.slice(1);
        
        newOrderComponents[componentTypeKey] = {
          id: uuidv4(),
          type: componentTypeKey, // Preserve original capitalization for UI
          color: materialColor,
          gsm: materialGsm,
          length,
          width,
          consumption,
          baseConsumption: baseConsumption?.toString(),
          roll_width: materialRollWidth || rollWidth,
          material_id: materialId
        };
        
        // Store base consumption for standard component
        if (baseConsumption) {
          newBaseConsumptions[componentTypeLower] = baseConsumption;
        }
      }
    });

    // Replace all components with the new ones
    setComponents(newOrderComponents);
    setCustomComponents(newCustomComponents);
    setBaseConsumptions(newBaseConsumptions);

    // If quantity already entered, update consumption values
    if (formData.quantity) {
      const quantity = parseFloat(formData.quantity);
      if (!isNaN(quantity) && quantity > 0) {
        const totalQty = quantity * productQuantity;
        setFormData(prev => ({
          ...prev,
          total_quantity: totalQty.toString()
        }));
        setTimeout(() => updateConsumptionBasedOnQuantity(totalQty), 100);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1"
          onClick={() => window.location.href = `/orders/${id}`}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
          <p className="text-muted-foreground">Update order details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OrderDetailsForm 
          formData={formData}
          handleOrderChange={handleOrderChange}
          formErrors={formErrors}
          onProductSelect={handleProductSelect}
          updateConsumptionBasedOnQuantity={updateConsumptionBasedOnQuantity}
        />

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
                defaultQuantity={formData.total_quantity || formData.quantity}
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
                  defaultQuantity={formData.total_quantity || formData.quantity}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.location.href = `/orders/${id}`}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Order"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default OrderEdit;
