import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection, CustomComponent } from "@/components/orders/CustomComponentSection";
import { useOrderForm } from "@/hooks/use-order-form";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardFooter, 
  CardTitle, 
  CardDescription,
} from "@/components/ui/card";
import { OrderFormOptimizer, setupCacheInterceptor, optimizeComponentRendering } from "@/components/optimization/OrderFormOptimizer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ConsumptionFormulaType } from "@/components/production/ConsumptionCalculator";
import { Order } from "@/types/order";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
};

const OrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const {
    orderDetails,
    components,
    customComponents,
    formErrors,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    validateForm,
    updateConsumptionBasedOnQuantity,
    handleSubmit,
    submitting,
    setDatabaseLoadingState
  } = useOrderForm();

  // Initialize performance optimizations when component mounts
  useEffect(() => {
    setupCacheInterceptor();
    
    const timer = setTimeout(() => {
      optimizeComponentRendering();
    }, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();
          
        if (orderError) throw orderError;
        
        // Cast orderData to include our custom fields
        const typedOrderData = orderData as Order & {
          order_quantity?: number | null;
          product_quantity?: number | null;
          total_quantity?: number | null;
          catalog_id?: string | null;
        };
        
        // Format order data for the form
        handleOrderChange({
          target: {
            name: "company_name",
            value: typedOrderData.company_name || ""
          }
        });
        handleOrderChange({
          target: {
            name: "company_id",
            value: typedOrderData.company_id
          }
        });
        
        // Set the base quantity (order quantity) - default to 1 if not available
        const orderQty = typedOrderData.order_quantity || typedOrderData.quantity || 1;
        const productQty = typedOrderData.product_quantity || 1;
        const totalQty = (orderQty * productQty).toString();
        
        // Set all quantity fields
        handleOrderChange({
          target: {
            name: "order_quantity",
            value: orderQty.toString()
          }
        });
        handleOrderChange({
          target: {
            name: "product_quantity",
            value: productQty.toString()
          }
        });
        handleOrderChange({
          target: {
            name: "quantity",
            value: totalQty
          }
        });
        handleOrderChange({
          target: {
            name: "total_quantity",
            value: totalQty
          }
        });
        handleOrderChange({
          target: {
            name: "bag_length",
            value: typedOrderData.bag_length?.toString() || ""
          }
        });
        handleOrderChange({
          target: {
            name: "bag_width",
            value: typedOrderData.bag_width?.toString() || ""
          }
        });
        handleOrderChange({
          target: {
            name: "border_dimension",
            value: typedOrderData.border_dimension?.toString() || ""
          }
        });
        handleOrderChange({
          target: {
            name: "rate",
            value: typedOrderData.rate ? typedOrderData.rate.toString() : ""
          }
        });
        handleOrderChange({
          target: {
            name: "special_instructions",
            value: typedOrderData.special_instructions || ""
          }
        });
        handleOrderChange({
          target: {
            name: "order_date",
            value: new Date(typedOrderData.order_date).toISOString().split('T')[0]
          }
        });
        handleOrderChange({
          target: {
            name: "sales_account_id",
            value: typedOrderData.sales_account_id
          }
        });
        handleOrderChange({
          target: {
            name: "order_number",
            value: typedOrderData.order_number || ""
          }
        });

        // If there's a catalog_id, fetch and set the product
        if (typedOrderData.catalog_id) {
          // Set the catalog_id in form data first
          handleOrderChange({
            target: {
              name: "catalog_id",
              value: typedOrderData.catalog_id
            }
          });
          
          const { data: catalogData, error: catalogError } = await supabase
            .from("catalog")
            .select("*, catalog_components(*)")
            .eq("id", typedOrderData.catalog_id)
            .single();

          if (!catalogError && catalogData) {
            handleProductSelect(catalogData.catalog_components || []);
          }
        }
        
        // Fetch order components
        const { data: componentsData, error: componentsError } = await supabase
          .from("order_components")
          .select("*")
          .eq("order_id", id);
          
        if (componentsError) throw componentsError;
        
        // Set loading state to prevent automatic consumption updates
        if (setDatabaseLoadingState) {
          setDatabaseLoadingState(true);
        }
        
        // Process components
        if (componentsData && componentsData.length > 0) {
          componentsData.forEach(comp => {
            let length = "", width = "";
            if (comp.size) {
              const sizeParts = comp.size.split('x');
              if (sizeParts.length >= 2) {
                length = sizeParts[0] || "";
                width = sizeParts[1] || "";
              }
            }
            
            // CORRECTED: Handle manual consumption properly during order editing
            const isManual = comp.formula === 'manual';
            const dbConsumption = comp.consumption || 0; // This is the per-unit value from database
            const orderQty = parseInt(orderDetails.order_quantity || orderDetails.quantity || '1');
            
            // For manual components, multiply by order quantity for display
            // For calculated components, use the stored value as-is
            const displayConsumption = isManual ? (dbConsumption * orderQty) : dbConsumption;
            
            console.log(`📥 LOADING Component ${comp.component_type}: DB=${dbConsumption}, OrderQty=${orderQty}, Display=${displayConsumption}, Formula=${comp.formula}`);
            
            const componentData = {
              id: comp.id,
              type: comp.component_type,
              color: comp.color || "",
              gsm: comp.gsm?.toString() || "",
              length,
              width,
              roll_width: comp.roll_width?.toString() || "",
              consumption: displayConsumption.toString(),
              fetchedConsumption: dbConsumption.toString(), // Store original DB value for manual components
              material_id: comp.material_id || null,
              customName: comp.custom_name || "",
              materialCost: comp.component_cost || 0,
              componentCostBreakdown: comp.component_cost_breakdown || null,
              formula: (comp.formula || 'standard') as ConsumptionFormulaType,
              is_manual_consumption: isManual
            };
            
            if (comp.component_type === 'custom') {
              // Add custom component
              addCustomComponent();
              const index = customComponents.length;
              Object.entries(componentData).forEach(([field, value]) => {
                if (field !== 'id' && field !== 'type') {
                  handleCustomComponentChange(index, field, value?.toString() || '');
                }
              });
            } else {
              const uiComponentType = comp.component_type.charAt(0).toUpperCase() + comp.component_type.slice(1);
              Object.entries(componentData).forEach(([field, value]) => {
                if (field !== 'id' && field !== 'type') {
                  handleComponentChange(uiComponentType, field, value?.toString() || '');
                }
              });
            }
          });
        }
        
        // Turn off loading state after processing all components
        if (setDatabaseLoadingState) {
          setDatabaseLoadingState(false);
        }
        
      } catch (error: any) {
        toast({
          title: "Error fetching order details",
          description: error.message,
          variant: "destructive"
        });
        window.location.href = "/orders";
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id]);

  // Use the handleSubmit function from useOrderForm which handles both create and update
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast({
        title: "Error",
        description: "No order ID provided for update",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await handleSubmit(e, id);
      if (result) {
        toast({
          title: "Success",
          description: "Order updated successfully",
          variant: "default"
        });
        // Redirect to order details page after a short delay
        setTimeout(() => {
          window.location.href = `/orders/${id}`;
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <OrderFormOptimizer>
    <div className="space-y-6">
        <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
              onClick={() => window.location.href = "/orders"}
          className="gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
              <p className="text-muted-foreground">Modify the order details</p>
            </div>
        </div>
      </div>

        <form onSubmit={onSubmit} className="space-y-6">
        <OrderDetailsForm 
            formData={orderDetails}
          handleOrderChange={handleOrderChange}
            onProductSelect={handleProductSelect}
          formErrors={formErrors}
          updateConsumptionBasedOnQuantity={updateConsumptionBasedOnQuantity}
        />
          
          <StandardComponents
            components={components}
            componentOptions={componentOptions}
            onChange={(type, field, value) => handleComponentChange(type, field, value)}
            defaultQuantity={orderDetails.quantity}
            showConsumption={true}
        />

        <Card>
          <CardHeader>
              <CardTitle>Custom Components</CardTitle>
              <CardDescription>Add any additional components specific to this order</CardDescription>
          </CardHeader>
          <CardContent>
              <CustomComponentSection
                customComponents={customComponents as CustomComponent[]}
                componentOptions={componentOptions}
                handleCustomComponentChange={handleCustomComponentChange}
                removeCustomComponent={removeCustomComponent}
                defaultQuantity={orderDetails.quantity}
                showConsumption={true}
              />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomComponent}
                className="mt-4"
                  >
                Add Custom Component
                  </Button>
            </CardContent>
          </Card>
          
          <CardFooter className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.location.href = "/orders"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Order"}
            </Button>
          </CardFooter>
      </form>
    </div>
    </OrderFormOptimizer>
  );
};

export default OrderEdit;
