
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useOrderForm } from "@/hooks/use-order-form";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DBOrderStatus } from "@/types/order";

const OrderNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  // Use the order form hook to manage state and validation
  const {
    orderDetails,
    components,
    customComponents,
    formErrors,
    submitting,
    totalMaterialCost,
    materialUsage,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm
  } = useOrderForm();

  // Fetch order data if in edit mode
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          components (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  // Populate form with existing data when in edit mode
  useEffect(() => {
    if (isEditMode && orderData && !isLoading) {
      // Convert database status to frontend status if needed
      const frontendStatus = orderData.status === 'in_production' ? 'processing' : orderData.status;

      // Create payload to update all order details
      handleOrderChange({ 
        target: { 
          name: 'company_name', 
          value: orderData.company_name 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'company_id', 
          value: orderData.company_id 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'quantity', 
          value: orderData.quantity.toString() 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'bag_length', 
          value: orderData.bag_length.toString() 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'bag_width', 
          value: orderData.bag_width.toString() 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'rate', 
          value: orderData.rate?.toString() || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'order_date', 
          value: orderData.order_date 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'delivery_date', 
          value: orderData.delivery_date || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'special_instructions', 
          value: orderData.special_instructions || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'status', 
          value: frontendStatus 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'catalog_id', 
          value: orderData.catalog_id || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'customer_name', 
          value: orderData.customer_name || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'customer_phone', 
          value: orderData.customer_phone || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'customer_address', 
          value: orderData.customer_address || '' 
        } 
      });
      handleOrderChange({ 
        target: { 
          name: 'description', 
          value: orderData.description || '' 
        } 
      });

      // If there are components, set them
      if (orderData.components && Array.isArray(orderData.components)) {
        // Process components based on type
        const processedComponents: Record<string, any> = {};
        const processedCustomComponents: any[] = [];

        orderData.components.forEach((comp: any) => {
          const componentData = {
            id: comp.id,
            component_type: comp.component_type,
            type: comp.type || comp.component_type,
            color: comp.color || '',
            gsm: comp.gsm || '',
            size: comp.size || '',
            length: comp.length || '',
            width: comp.width || '',
            material_id: comp.material_id || '',
            roll_width: comp.roll_width || '',
            consumption: comp.consumption || '',
            details: comp.details || ''
          };

          if (comp.custom_name || comp.component_type === 'custom') {
            processedCustomComponents.push({
              ...componentData,
              custom_name: comp.custom_name || comp.component_type,
              type: 'custom'
            });
          } else if (
            comp.component_type === 'part' || 
            comp.component_type === 'border' || 
            comp.component_type === 'handle' || 
            comp.component_type === 'chain' || 
            comp.component_type === 'runner'
          ) {
            processedComponents[comp.component_type] = componentData;
          }
        });

        // Update state with processed components - We'll implement these handlers separately
        Object.entries(processedComponents).forEach(([type, comp]) => {
          Object.entries(comp).forEach(([field, value]) => {
            if (field !== 'id' && field !== 'type') {
              handleComponentChange(type, field, value as string);
            }
          });
        });

        // Update custom components 
        processedCustomComponents.forEach((comp, index) => {
          if (index === 0) {
            addCustomComponent();
          }
          Object.entries(comp).forEach(([field, value]) => {
            if (field !== 'id') {
              handleCustomComponentChange(index, field, value as string);
            }
          });
        });
      }
    }
  }, [isEditMode, orderData, isLoading, handleOrderChange, handleComponentChange, handleCustomComponentChange, addCustomComponent]);

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation errors",
        description: "Please correct the errors in the form",
        variant: "destructive"
      });
      return;
    }
    
    // Submit the form
    const success = await handleSubmit(isEditMode, id);
    if (success) {
      navigate("/orders");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Order' : 'New Order'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Update order details' : 'Create a new order'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmitForm} className="space-y-6">
        {/* Order details section */}
        <OrderDetailsForm 
          formData={orderDetails} 
          handleOrderChange={handleOrderChange}
          onProductSelect={handleProductSelect}
          formErrors={formErrors}
          totalMaterialCost={totalMaterialCost}
          materialUsage={materialUsage}
        />
        
        {/* Standard components section */}
        <StandardComponents
          components={components}
          handleComponentChange={handleComponentChange}
        />

        {/* Custom components section */}
        <CustomComponentSection
          components={customComponents}
          handleComponentChange={handleCustomComponentChange}
          addComponent={addCustomComponent}
          removeComponent={removeCustomComponent}
        />

        {/* Form actions */}
        <Card>
          <CardFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/orders")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
              >
                {submitting 
                  ? (isEditMode ? "Updating..." : "Creating...") 
                  : (isEditMode ? "Update Order" : "Create Order")
                }
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default OrderNew;
