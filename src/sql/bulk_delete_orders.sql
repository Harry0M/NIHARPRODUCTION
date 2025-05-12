-- Function to delete multiple orders at once
CREATE OR REPLACE FUNCTION public.bulk_delete_orders(
  order_ids uuid[]
)
RETURNS TABLE (
  deleted_count integer,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_order_id uuid;
  v_result record;
BEGIN
  -- Initialize return values
  deleted_count := 0;
  status := 'success';
  
  -- Loop through each order ID
  FOREACH v_order_id IN ARRAY order_ids
  LOOP
    BEGIN
      -- Call the existing delete_order_completely function for each order
      SELECT * FROM public.delete_order_completely(v_order_id) INTO v_result;
      
      -- Increment the counter for successfully deleted orders
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but continue with other orders
      RAISE NOTICE 'Error deleting order %: %', v_order_id, SQLERRM;
    END;
  END LOOP;
  
  -- Set the final count of deleted orders
  deleted_count := v_count;
  
  -- If we didn't delete all orders, adjust the status
  IF v_count < array_length(order_ids, 1) THEN
    status := 'partial';
  END IF;
  
  -- Return the results
  RETURN NEXT;
END;
$$;

-- Add RLS policy to allow authenticated users to execute this function
GRANT EXECUTE ON FUNCTION public.bulk_delete_orders(uuid[]) TO authenticated;
