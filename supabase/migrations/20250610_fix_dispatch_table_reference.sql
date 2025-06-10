-- Fix the delete_order_completely function to use correct dispatch table names
-- The function was referencing 'public.dispatch' which doesn't exist
-- Actual tables are 'order_dispatches' and 'dispatch_batches'

CREATE OR REPLACE FUNCTION delete_order_completely(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_order_exists BOOLEAN;
    v_error_detail TEXT;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
        RAISE EXCEPTION 'Order with ID % does not exist', p_order_id;
        RETURN FALSE;
    END IF;

    BEGIN
        -- Start transaction
        -- Delete related records in dependency order to avoid foreign key violations

        -- 1. Delete dispatch batches first (they depend on order_dispatches)
        DELETE FROM dispatch_batches db
        WHERE db.order_dispatch_id IN (
            SELECT od.id FROM order_dispatches od WHERE od.order_id = p_order_id
        );

        -- 2. Delete order dispatches (they depend on orders)
        DELETE FROM order_dispatches od WHERE od.order_id = p_order_id;

        -- 3. Delete transactions (they depend on orders)
        -- First get all transactions for this order for potential inventory reversal
        DELETE FROM transactions t WHERE t.order_id = p_order_id;

        -- 4. Delete cutting components (they depend on cutting jobs)
        DELETE FROM cutting_components cc
        WHERE cc.cutting_job_id IN (
            SELECT cj.id FROM cutting_jobs cj 
            JOIN job_cards jc ON cj.job_card_id = jc.id
            WHERE jc.order_id = p_order_id
        );

        -- 5. Delete cutting jobs (they depend on job cards)
        DELETE FROM cutting_jobs cj
        WHERE cj.job_card_id IN (
            SELECT jc.id FROM job_cards jc WHERE jc.order_id = p_order_id
        );

        -- 6. Delete printing jobs (they depend on job cards)
        DELETE FROM printing_jobs pj
        WHERE pj.job_card_id IN (
            SELECT jc.id FROM job_cards jc WHERE jc.order_id = p_order_id
        );

        -- 7. Delete stitching jobs (they depend on job cards)
        DELETE FROM stitching_jobs sj
        WHERE sj.job_card_id IN (
            SELECT jc.id FROM job_cards jc WHERE jc.order_id = p_order_id
        );

        -- 8. Delete job cards (they depend on orders)
        DELETE FROM job_cards jc WHERE jc.order_id = p_order_id;

        -- 9. Delete order components (they depend on orders)
        DELETE FROM order_components oc WHERE oc.order_id = p_order_id;

        -- 10. Finally delete the order itself
        DELETE FROM orders o WHERE o.id = p_order_id;

        RETURN TRUE;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error details
        GET STACKED DIAGNOSTICS v_error_detail = PG_EXCEPTION_DETAIL;
        RAISE EXCEPTION 'Failed to delete order %: % (Detail: %)', 
            p_order_id, SQLERRM, v_error_detail;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_order_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_order_completely(UUID) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION delete_order_completely(UUID) IS 
'Safely deletes an order and all its related records (job cards, jobs, components, dispatches, transactions) in the correct dependency order to avoid foreign key violations. Updated to use correct dispatch table names: order_dispatches and dispatch_batches.';
