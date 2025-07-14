import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { OrderFormData, Component } from "@/types/order";
import { validateComponentData, convertStringToNumeric } from "@/utils/orderFormUtils";

interface UseOrderDetailEditingProps {
  orderId: string;
  onOrderUpdated?: () => void;
  onComponentsUpdated?: () => void;
}

/**
 * Hook to handle order editing functionality in the detail page
 */
export function useOrderDetailEditing({
  orderId,
  onOrderUpdated,
  onComponentsUpdated
}: UseOrderDetailEditingProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isEditingOrderInfo, setIsEditingOrderInfo] = useState(false);
  const [isEditingComponents, setIsEditingComponents] = useState(false);

  // Helper function to recalculate material cost
  const recalculateMaterialCost = async (): Promise<void> => {
    try {
      // Get all current components for this order
      const { data: components, error: componentsError } = await supabase
        .from("order_components")
        .select("component_cost")
        .eq("order_id", orderId);

      if (componentsError) {
        console.error("Error fetching components for cost recalculation:", componentsError);
        return;
      }

      // Calculate total material cost
      const totalMaterialCost = (components || []).reduce((sum, comp) => {
        return sum + (comp.component_cost || 0);
      }, 0);

      console.log("Recalculating material cost:", totalMaterialCost);

      // Get current order data to update total cost
      const { data: orderData, error: orderFetchError } = await supabase
        .from("orders")
        .select("production_cost, total_cost")
        .eq("id", orderId)
        .single();

      if (orderFetchError) {
        console.error("Error fetching order data for cost recalculation:", orderFetchError);
        // Still update material cost even if we can't get other costs
        const { error: materialCostUpdateError } = await supabase
          .from("orders")
          .update({ material_cost: totalMaterialCost })
          .eq("id", orderId);

        if (materialCostUpdateError) {
          console.error("Error updating material cost:", materialCostUpdateError);
        }
      } else {
        // Recalculate total cost: material_cost + production_cost
        const productionCost = orderData.production_cost || 0;
        const totalCost = totalMaterialCost + productionCost;

        // Update order with new material cost and total cost
        const { error: costUpdateError } = await supabase
          .from("orders")
          .update({
            material_cost: totalMaterialCost,
            total_cost: totalCost
          })
          .eq("id", orderId);

        if (costUpdateError) {
          console.error("Error updating order costs:", costUpdateError);
        } else {
          console.log("Successfully updated order material cost and total cost");
        }
      }
    } catch (error) {
      console.error("Exception in recalculateMaterialCost:", error);
    }
  };

  // Update order basic information
  const updateOrderInfo = async (orderData: Partial<OrderFormData>): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      // Validate that the sales_account_id (company_id) exists if provided
      let validatedSalesAccountId = null;
      let companyName = orderData.company_name || "";
      
      if (orderData.sales_account_id) {
        try {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("id, name")
            .eq("id", orderData.sales_account_id)
            .single();
          
          if (companyError) {
            console.warn("Company validation error:", companyError);
          } else if (companyData) {
            validatedSalesAccountId = companyData.id;
            if (!companyName || companyName.trim() === "") {
              companyName = companyData.name;
            }
          }
        } catch (err) {
          console.error("Error validating company:", err);
        }
      }
      
      // Always ensure company_name has a value
      if (!companyName || companyName.trim() === "") {
        companyName = "Unnamed Company";
      }
      
      // Prepare update data (excluding cost fields to preserve existing calculations)
      const updateData = {
        company_name: companyName,
        company_id: orderData.company_id,
        quantity: orderData.total_quantity ? parseInt(orderData.total_quantity) : undefined,
        order_quantity: orderData.order_quantity ? parseInt(orderData.order_quantity) : undefined,
        bag_length: orderData.bag_length ? parseFloat(orderData.bag_length) : undefined,
        bag_width: orderData.bag_width ? parseFloat(orderData.bag_width) : undefined,
        border_dimension: orderData.border_dimension ? parseFloat(orderData.border_dimension) : undefined,
        order_date: orderData.order_date,
        delivery_date: orderData.delivery_date || null,
        // Only update order_number if a valid value is provided (never set to null)
        order_number: orderData.order_number && orderData.order_number.trim() !== "" ? orderData.order_number : undefined,
        sales_account_id: validatedSalesAccountId,
        catalog_id: orderData.catalog_id || null,
        special_instructions: orderData.special_instructions || null
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      console.log("Updating order info:", cleanedData);

      const { error } = await supabase
        .from("orders")
        .update(cleanedData)
        .eq("id", orderId);

      if (error) throw error;

      showToast({
        title: "Order Updated",
        description: "Order information has been updated successfully",
        type: "success"
      });

      if (onOrderUpdated) {
        onOrderUpdated();
      }

      return true;
    } catch (error: unknown) {
      console.error("Error updating order info:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showToast({
        title: "Error updating order",
        description: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Update order costs
  const updateOrderCosts = async (costsData: {
    materialCost: number;
    cuttingCharge: number;
    printingCharge: number;
    stitchingCharge: number;
    transportCharge: number;
    wastagePercentage: number;
    wastageCost: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
  }): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      const updateData = {
        material_cost: costsData.materialCost,
        cutting_charge: costsData.cuttingCharge,
        printing_charge: costsData.printingCharge,
        stitching_charge: costsData.stitchingCharge,
        transport_charge: costsData.transportCharge,
        wastage_percentage: costsData.wastagePercentage,
        wastage_cost: costsData.wastageCost,
        production_cost: costsData.cuttingCharge + costsData.printingCharge + 
                        costsData.stitchingCharge + costsData.transportCharge,
        total_cost: costsData.totalCost,
        margin: costsData.margin,
        calculated_selling_price: costsData.sellingPrice,
        rate: costsData.sellingPrice
      };

      console.log("Updating order costs:", updateData);

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      showToast({
        title: "Costs Updated",
        description: "Order costs have been updated successfully",
        type: "success"
      });

      if (onOrderUpdated) {
        onOrderUpdated();
      }

      return true;
    } catch (error: unknown) {
      console.error("Error updating order costs:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showToast({
        title: "Error updating costs",
        description: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Update completion date
  const updateCompletionDate = async (completionDate: string): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_date: completionDate })
        .eq("id", orderId);

      if (error) throw error;

      showToast({
        title: "Completion Date Updated",
        description: "Expected completion date has been updated successfully",
        type: "success"
      });

      if (onOrderUpdated) {
        onOrderUpdated();
      }

      return true;
    } catch (error: unknown) {
      console.error("Error updating completion date:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showToast({
        title: "Error updating completion date",
        description: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Update order components
  const updateOrderComponents = async (components: Component[]): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      console.log("Updating order components:", components);

      // Delete existing components
      const { error: deleteError } = await supabase
        .from("order_components")
        .delete()
        .eq("order_id", orderId);

      if (deleteError) throw deleteError;

      // Validate and format components
      const validComponents = components
        .filter(comp => {
          const isValid = validateComponentData(comp);
          if (!isValid) {
            console.error("Component validation failed:", comp);
          }
          return isValid;
        })
        .map(comp => {
          // Format component for database insertion
          let componentType = String(comp.component_type || '').toLowerCase().trim();
          
          const validComponentTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];
          
          if (!validComponentTypes.includes(componentType)) {
            console.warn(`Invalid component type "${componentType}" - forcing to "part"`);
            componentType = 'part';
          }

          const size = comp.length && comp.width ? `${comp.length}x${comp.width}` : comp.size || null;
          const customName = componentType === 'custom' ? comp.custom_name : null;

          return {
            order_id: orderId,
            component_type: componentType,
            is_custom: componentType === 'custom',
            size: size,
            color: comp.color || null,
            gsm: comp.gsm ? convertStringToNumeric(String(comp.gsm)) : null,
            custom_name: customName,
            material_id: comp.material_id || null,
            roll_width: comp.roll_width ? convertStringToNumeric(String(comp.roll_width)) : null,
            consumption: comp.consumption ? convertStringToNumeric(String(comp.consumption)) : null,
            component_cost: comp.component_cost ? 
              convertStringToNumeric(String(comp.component_cost)) : null,
            component_cost_breakdown: comp.component_cost_breakdown || null
          };
        });

      if (validComponents.length > 0) {
        const { error: insertError } = await supabase
          .from("order_components")
          .insert(validComponents);

        if (insertError) throw insertError;

        // Recalculate material cost from updated components
        await recalculateMaterialCost();

        showToast({
          title: "Components Updated",
          description: `${validComponents.length} components have been updated successfully`,
          type: "success"
        });
      } else {
        showToast({
          title: "Warning",
          description: "No valid components found to save",
          type: "warning"
        });
      }

      if (onComponentsUpdated) {
        onComponentsUpdated();
      }

      return true;
    } catch (error: unknown) {
      console.error("Error updating order components:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showToast({
        title: "Error updating components",
        description: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Add a new component to the order
  const addComponent = async (component: Component): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      // Validate and format the component
      if (!validateComponentData(component)) {
        throw new Error("Component validation failed");
      }

      let componentType = String(component.component_type || '').toLowerCase().trim();
      const validComponentTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];
      
      if (!validComponentTypes.includes(componentType)) {
        componentType = 'part';
      }

      const componentToInsert = {
        order_id: orderId,
        component_type: componentType,
        is_custom: componentType === 'custom',
        size: component.length && component.width ? `${component.length}x${component.width}` : component.size || null,
        color: component.color || null,
        gsm: component.gsm ? convertStringToNumeric(String(component.gsm)) : null,
        custom_name: componentType === 'custom' ? component.custom_name : null,
        material_id: component.material_id || null,
        roll_width: component.roll_width ? convertStringToNumeric(String(component.roll_width)) : null,
        consumption: component.consumption ? convertStringToNumeric(String(component.consumption)) : null,
        component_cost: component.component_cost ? 
          convertStringToNumeric(String(component.component_cost)) : null,
        component_cost_breakdown: component.component_cost_breakdown || null
      };

      const { error } = await supabase
        .from("order_components")
        .insert([componentToInsert]);

      if (error) throw error;

      // Recalculate total material cost after adding component
      await recalculateMaterialCost();

      showToast({
        title: "Component Added",
        description: "Component has been added successfully",
        type: "success"
      });

      if (onComponentsUpdated) {
        onComponentsUpdated();
      }

      return true;
    } catch (error: unknown) {
      console.error("Error adding component:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showToast({
        title: "Error adding component",
        description: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a component from the order
  const deleteComponent = async (componentId: string): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("order_components")
        .delete()
        .eq("id", componentId);

      if (error) throw error;

      // Recalculate total material cost after deleting component
      await recalculateMaterialCost();

      showToast({
        title: "Component Deleted",
        description: "Component has been deleted successfully",
        type: "success"
      });

      if (onComponentsUpdated) {
        onComponentsUpdated();
      }

      return true;
    } catch (error: unknown) {
      console.error("Error deleting component:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showToast({
        title: "Error deleting component",
        description: errorMessage,
        type: "error"
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    isEditingOrderInfo,
    setIsEditingOrderInfo,
    isEditingComponents,
    setIsEditingComponents,
    updateOrderInfo,
    updateOrderCosts,
    updateCompletionDate,
    updateOrderComponents,
    addComponent,
    deleteComponent
  };
}
