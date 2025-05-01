
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { OrderFormData, Component, CustomComponent, DBOrderStatus, OrderStatus } from "@/types/order";
import { MaterialUsage } from "@/types/order";
import { toast } from "@/hooks/use-toast";

export function useOrderSubmission(
  orderDetails: OrderFormData,
  components: Record<string, any>,
  customComponents: CustomComponent[],
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
  inventoryItems?: any[]
) {
  // Helper function to map frontend status to DB status
  const mapStatusToDb = (status: OrderStatus): DBOrderStatus => {
    if (status === 'processing') return 'in_production';
    return status as DBOrderStatus;
  };

  const handleSubmit = async (isEditMode: boolean = false, orderId?: string): Promise<boolean> => {
    setSubmitting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Map frontend status to database status if needed
      const dbStatus: DBOrderStatus = orderDetails.status 
        ? mapStatusToDb(orderDetails.status as OrderStatus) 
        : 'pending';

      // Convert string values to proper types for the database
      const orderPayload = {
        company_name: orderDetails.company_name,
        company_id: orderDetails.company_id || null,
        catalog_id: orderDetails.catalog_id || null,
        quantity: parseInt(orderDetails.quantity) || 0,
        bag_length: parseFloat(orderDetails.bag_length) || 0,
        bag_width: parseFloat(orderDetails.bag_width) || 0,
        rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
        order_date: orderDetails.order_date,
        delivery_date: orderDetails.delivery_date || null,
        special_instructions: orderDetails.special_instructions || null,
        status: dbStatus,
        customer_name: orderDetails.customer_name || null,
        customer_phone: orderDetails.customer_phone || null,
        customer_address: orderDetails.customer_address || null,
        description: orderDetails.description || null,
        created_by: userData.user?.id || null
      };
      
      let responseOrderId = orderId;
      
      // Insert or update order record
      if (isEditMode && orderId) {
        // Update existing order
        const { error: orderError } = await supabase
          .from("orders")
          .update(orderPayload)
          .eq('id', orderId);
          
        if (orderError) throw orderError;
        
        // Delete existing components to replace with new ones
        const { error: deleteComponentsError } = await supabase
          .from("components")
          .delete()
          .eq('order_id', orderId);
          
        if (deleteComponentsError) throw deleteComponentsError;
      } else {
        // Create new order
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert(orderPayload)
          .select('id')
          .single();
        
        if (orderError) throw orderError;
        responseOrderId = newOrder.id;
      }
      
      // Prepare all components for insertion
      const allComponentsToInsert = [];
      
      // Add standard components
      for (const [type, component] of Object.entries(components)) {
        if (component) {
          allComponentsToInsert.push({
            order_id: responseOrderId,
            component_type: type,
            type: component.type || type,
            color: component.color || null,
            gsm: component.gsm || null,
            size: component.size || (component.length && component.width ? `${component.length}x${component.width}` : null),
            details: component.details || null
          });
        }
      }
      
      // Add custom components
      for (const component of customComponents) {
        if (component && component.custom_name) {
          allComponentsToInsert.push({
            order_id: responseOrderId,
            component_type: 'custom',
            type: 'custom',
            color: component.color || null,
            gsm: component.gsm || null,
            size: component.size || (component.length && component.width ? `${component.length}x${component.width}` : null),
            custom_name: component.custom_name,
            details: component.details || null
          });
        }
      }
      
      // Insert all components if there are any to insert
      if (allComponentsToInsert.length > 0) {
        const { error: componentsError } = await supabase
          .from("components")
          .insert(allComponentsToInsert);
          
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Warning",
            description: "Order saved but components could not be saved. Please try again.",
            variant: "destructive"
          });
        }
      }
      
      // If we have material usage data, save it for future reference
      if (inventoryItems && inventoryItems.length > 0) {
        const materialUsage = inventoryItems
          .filter(item => item.consumption > 0)
          .map(item => ({
            material_id: item.id,
            material_name: item.name,
            material_color: item.color,
            material_gsm: item.gsm,
            consumption: item.consumption,
            available_quantity: item.quantity,
            unit: item.unit,
            cost: item.cost || 0,
            component_type: item.component_type || 'unknown'
          }));
          
        // Store this in localStorage for future reference
        localStorage.setItem('orderMaterialUsage', JSON.stringify(materialUsage));
      }
      
      toast({
        title: isEditMode ? "Order updated" : "Order created",
        description: `Order has been ${isEditMode ? "updated" : "created"} successfully.`
      });
      
      return true;
    } catch (error: any) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save order",
        variant: "destructive"
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };
  
  return {
    handleSubmit
  };
}
