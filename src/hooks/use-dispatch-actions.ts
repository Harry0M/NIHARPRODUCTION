
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useDispatchActions = () => {
  const handleDispatch = async (orderId: string, formData: any) => {
    try {
      // Validate input data
      if (!orderId) {
        throw new Error("Order ID is required");
      }

      if (!formData.recipient_name || !formData.delivery_address) {
        throw new Error("Recipient name and delivery address are required");
      }

      // Create dispatch record
      const { data: dispatchData, error: dispatchError } = await supabase
        .from("order_dispatches")
        .insert([{
          order_id: orderId,
          recipient_name: formData.recipient_name,
          delivery_address: formData.delivery_address,
          delivery_date: formData.batches[0].delivery_date,
          tracking_number: formData.tracking_number || null,
          notes: formData.notes || null,
          quality_checked: formData.confirm_quality_check,
          quantity_checked: formData.confirm_quantity_check,
        }])
        .select()
        .single();

      if (dispatchError) {
        if (dispatchError.code === '23505') {
          throw new Error("This order has already been dispatched");
        }
        throw dispatchError;
      }

      if (!dispatchData?.id) {
        throw new Error("Failed to create dispatch record");
      }

      // Create batch records
      const batchInserts = formData.batches.map((batch: any, index: number) => ({
        order_dispatch_id: dispatchData.id,
        batch_number: index + 1,
        quantity: batch.quantity,
        delivery_date: batch.delivery_date,
        notes: batch.notes || null,
      }));

      const { error: batchError } = await supabase
        .from("dispatch_batches")
        .insert(batchInserts);

      if (batchError) {
        // Cleanup the dispatch record if batch creation fails
        await supabase
          .from("order_dispatches")
          .delete()
          .eq("id", dispatchData.id);
          
        throw new Error("Failed to create dispatch batches: " + batchError.message);
      }

      // Update order status
      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: "dispatched" as const })
        .eq("id", orderId);

      if (statusError) {
        throw new Error("Failed to update order status: " + statusError.message);
      }

      toast({ 
        title: "Dispatch Complete", 
        description: "Order has been successfully marked as dispatched." 
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      
      toast({
        title: "Error During Dispatch",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Dispatch error:", error);
      return false;
    }
  };

  return {
    handleDispatch,
  };
};
