-- Migration: Update job number format to use order number
-- Change job number format from JOB-YYYY-NNN to JOB-[ORDER_NUMBER]

CREATE OR REPLACE FUNCTION "public"."generate_job_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_order_number TEXT;
BEGIN
    -- Get the order number from the orders table using the order_id
    SELECT order_number INTO v_order_number
    FROM public.orders 
    WHERE id = NEW.order_id;
    
    -- If order number is found, create job number using it
    IF v_order_number IS NOT NULL THEN
        NEW.job_number := 'JOB-' || v_order_number;
    ELSE
        -- Fallback to original format if order not found (shouldn't happen)
        NEW.job_number := 'JOB-' || to_char(current_date, 'YYYY') || '-' ||
            LPAD(COALESCE(
                (SELECT COUNT(*) + 1 FROM public.job_cards 
                 WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
                '1'
            ), 3, '0');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add comment to explain the change
COMMENT ON FUNCTION "public"."generate_job_number"() IS 'Generates job numbers in format JOB-[ORDER_NUMBER] based on the associated order';
