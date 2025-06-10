-- Fix Order Number Auto-Generation Issue
-- This creates the missing database trigger to auto-generate order numbers
-- when the order_number field is NULL or empty during order creation

-- Step 1: Create the order number generation function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate order number if it's NULL or empty
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || to_char(current_date, 'YYYY') || '-' ||
            LPAD(COALESCE(
                (SELECT COUNT(*) + 1 FROM public.orders 
                 WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
                '1'
            ), 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_order_number ON public.orders;

-- Step 3: Create the trigger to auto-generate order numbers
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- Step 4: Update existing orders that might be missing order numbers
WITH numbered_orders AS (
    SELECT 
        id,
        'ORD-' || to_char(created_at, 'YYYY') || '-' || 
        LPAD((
            ROW_NUMBER() OVER (
                PARTITION BY EXTRACT(YEAR FROM created_at) 
                ORDER BY created_at
            )
        )::TEXT, 4, '0') AS new_order_number
    FROM public.orders 
    WHERE order_number IS NULL OR order_number = ''
)
UPDATE public.orders 
SET order_number = numbered_orders.new_order_number
FROM numbered_orders
WHERE public.orders.id = numbered_orders.id;

-- Step 5: Add comments for documentation
COMMENT ON FUNCTION public.generate_order_number() IS 'Automatically generates order numbers for new orders when order_number is NULL or empty';
COMMENT ON TRIGGER set_order_number ON public.orders IS 'Auto-generates order numbers using format ORD-YYYY-NNNN when order_number is not provided';

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;

-- Step 7: Verification - Show sample of recent orders
DO $$
DECLARE
    sample_record RECORD;
    order_count INTEGER;
BEGIN
    -- Check total orders count
    SELECT COUNT(*) INTO order_count FROM public.orders;
    RAISE NOTICE 'Total orders in database: %', order_count;
    
    -- Show sample of recent orders
    RAISE NOTICE 'Sample of recent orders:';
    FOR sample_record IN (
        SELECT id, order_number, company_name, created_at
        FROM public.orders 
        ORDER BY created_at DESC 
        LIMIT 5
    ) LOOP
        RAISE NOTICE 'Order ID: %, Number: %, Company: %, Date: %', 
            sample_record.id, 
            sample_record.order_number, 
            sample_record.company_name, 
            sample_record.created_at;
    END LOOP;
    
    RAISE NOTICE 'Order number generation trigger has been created successfully.';
    RAISE NOTICE 'Manual order numbers will be preserved, empty ones will be auto-generated.';
END;
$$;
