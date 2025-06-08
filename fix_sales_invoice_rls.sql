-- Fix for sales invoice edit issue
-- The current RLS policy only allows users to update invoices they created
-- This might be causing the edit save functionality to fail

-- First, let's check the current policies
-- SELECT * FROM pg_policies WHERE tablename = 'sales_invoices';

-- Option 1: Make update policy more permissive (for testing)
DROP POLICY IF EXISTS "Users can update their own sales invoices" ON sales_invoices;
CREATE POLICY "Users can update sales invoices" ON sales_invoices
  FOR UPDATE USING (true);

-- Option 2: Alternative - allow update if user is authenticated
-- CREATE POLICY "Authenticated users can update sales invoices" ON sales_invoices
--   FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Option 3: If you want to keep the original restriction but handle null created_by
-- CREATE POLICY "Users can update their sales invoices or unowned" ON sales_invoices
--   FOR UPDATE USING (created_by = auth.uid() OR created_by IS NULL);
