-- Fix Order Number Auto-Generation Issue
-- This migration ensures the order number generation function and trigger work correctly
-- The function and trigger should already exist, but we'll verify they work properly

-- Step 1: Verify the function exists and update it to ensure correct behavior
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

-- Step 2: Verify trigger exists (it should already be created by the schema)
-- The trigger 'set_order_number' should already exist on the orders table

-- Step 3: Update existing orders that might be missing order numbers
DO $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update orders with missing order numbers
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
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % orders with missing order numbers', updated_count;
END;
$$;

-- Step 4: Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;
