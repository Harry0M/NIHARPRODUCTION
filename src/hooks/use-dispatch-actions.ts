
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useDispatchActions = () => {
  const handleDispatch = async (orderId: string, formData: any) => {
    try {
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

      if (dispatchError) throw dispatchError;

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

      if (batchError) throw batchError;

      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: "dispatched" as const })
        .eq("id", orderId);

      if (statusError) throw statusError;

      toast({ 
        title: "Dispatch Complete", 
        description: "Order has been marked as dispatched!" 
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error dispatching order",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleDispatch,
  };
};
