-- Remove the expected_completion_date column since we already have delivery_date
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS expected_completion_date;

-- Add comment to delivery_date for clarity
COMMENT ON COLUMN public.orders.delivery_date IS 'Expected delivery/completion date for the order (optional)';
