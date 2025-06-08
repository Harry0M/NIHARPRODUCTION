-- Quick database check and RLS policy fix for sales invoice edit issue
-- Run these commands in your Supabase SQL editor or database console

-- 1. Check current sales invoices
SELECT id, invoice_number, company_name, created_by, created_at 
FROM sales_invoices 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check current RLS policies on sales_invoices
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'sales_invoices';

-- 3. Check if there are any completed orders
SELECT id, order_number, company_name, status, created_at
FROM orders 
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Fix the RLS policy issue (THIS IS THE KEY FIX)
-- The current update policy only allows users to update invoices they created
-- This is likely causing the edit functionality to fail

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update their own sales invoices" ON sales_invoices;

-- Create a more permissive policy for testing
-- Option A: Allow all authenticated users to update (recommended for testing)
CREATE POLICY "Authenticated users can update sales invoices" ON sales_invoices
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Option B: Allow all updates (most permissive, use only for testing)
-- CREATE POLICY "All users can update sales invoices" ON sales_invoices
--   FOR UPDATE USING (true);

-- Option C: Allow updates for invoices with null created_by OR owned invoices
-- CREATE POLICY "Users can update their invoices or unowned" ON sales_invoices
--   FOR UPDATE USING (created_by = auth.uid() OR created_by IS NULL);

-- 5. Verify the new policy
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'sales_invoices' AND cmd = 'UPDATE';

-- 6. If you want to create a test invoice manually:
/*
INSERT INTO sales_invoices (
    invoice_number,
    company_name,
    product_name,
    quantity,
    rate,
    transport_included,
    transport_charge,
    gst_percentage,
    gst_amount,
    other_expenses,
    subtotal,
    total_amount,
    notes,
    created_by
) VALUES (
    'TEST-' || extract(epoch from now())::text,
    'Test Company',
    'Test Product',
    100,
    25.00,
    false,
    0,
    18,
    450.00,  -- 100 * 25.00 * 0.18
    50.00,
    2500.00, -- 100 * 25.00
    3000.00, -- 2500 + 450 + 50
    'Test invoice for debugging edit functionality',
    auth.uid()  -- This ensures the current user owns the invoice
);
*/
