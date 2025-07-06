-- Add expected completion date field to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS expected_completion_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.expected_completion_date IS 'Expected date for order completion (optional)';
