import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderFormValues } from "@/components/orders/OrderForm";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { useNavigate } from "react-router-dom";
import { calculateConsumption } from "@/lib/utils";

export const useOrderSubmission = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation(
    async (values: OrderFormValues) => {
      // Destructure the values object
      const { orderComponents, ...orderData } = values;

      // Insert order data into the 'orders' table
      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        showToast({
          title: "Error creating order",
          description: orderError.message,
          variant: "destructive",
        });
        throw orderError;
      }

      const orderId = orderResult.id;

      // Function to create order components
      const createOrderComponents = async () => {
        if (orderComponents && orderComponents.length > 0) {
          const componentsToInsert = orderComponents.map((component) => ({
            ...component,
            order_id: orderId,
          }));

          const { data: componentsResult, error: componentsError } = await supabase
            .from("order_components")
            .insert(componentsToInsert)
            .select();

          if (componentsError) {
            console.error("Error creating order components:", componentsError);
            showToast({
              title: "Error creating order components",
              description: componentsError.message,
              variant: "destructive",
            });
            throw componentsError;
          }
          return componentsResult;
        }
        return [];
      };

      // Function to record material usage
      const recordMaterialUsage = async (orderComponents: any[], orderNumber: string) => {
        try {
          for (const component of orderComponents) {
            // Skip if no material linked or consumption is zero/undefined
            if (!component.material_id || !component.consumption) continue;

            const consumedAmount = calculateConsumption(component);
            console.log(`Recording usage for material ${component.material_id}, amount: ${consumedAmount}`);
            
            // Create inventory transaction record
            const transactionData = {
              material_id: component.material_id, // Use material_id to match DB schema
              transaction_type: 'consumption',
              quantity: -consumedAmount, // Negative for consumption
              reference_type: 'order',
              reference_id: orderNumber,
              notes: `Material used in order ${orderNumber}`
            };

            const { data: transactionResult, error: transactionError } = await supabase
              .from("inventory_transactions")
              .insert(transactionData);

            if (transactionError) {
              console.error("Error recording material usage:", transactionError);
              showToast({
                title: "Error recording material usage",
                description: transactionError.message,
                variant: "destructive",
              });
            }
          }
        } catch (error: any) {
          console.error("Error in recordMaterialUsage:", error);
          showToast({
            title: "Error updating inventory",
            description: error.message,
            variant: "destructive",
          });
        }
      };

      // Execute the functions
      await createOrderComponents();
      await recordMaterialUsage(orderComponents, orderData.order_number);

      return orderResult;
    },
    {
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        showToast({
          title: "Order created successfully!",
          description: `Order ${data.order_number} has been created.`,
        });
        navigate("/orders");
      },
      onError: (error, variables, context) => {
        console.error("Error submitting order:", error);
        showToast({
          title: "Error submitting order",
          description: "Failed to create the order. Please try again.",
          variant: "destructive",
        });
      },
    }
  );

  return mutation;
};
