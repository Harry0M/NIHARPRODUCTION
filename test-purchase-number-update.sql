-- Test script to verify purchase number updates when invoice number changes
-- Run this in your Supabase SQL editor or psql

-- Test 1: Check if the trigger function was created successfully
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as returns,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_purchase_number_on_invoice_change';

-- Test 2: Check if the trigger was created successfully
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'update_purchase_number_on_invoice_change_trigger';

-- Test 3: Show current purchases with their invoice numbers
SELECT 
    id,
    purchase_number,
    invoice_number,
    status,
    created_at,
    updated_at
FROM purchases 
ORDER BY created_at DESC 
LIMIT 10;

-- Test 4: Test the trigger with a specific purchase (replace 'your-purchase-id' with actual ID)
-- First, let's find a purchase to test with
SELECT 
    id,
    purchase_number,
    invoice_number
FROM purchases 
WHERE id IN (
    SELECT id FROM purchases ORDER BY created_at DESC LIMIT 1
);

-- Test 5: Manual test - Update invoice number and see if purchase number changes
-- You can run this with a real purchase ID:
/*
UPDATE purchases 
SET invoice_number = 'TEST-7898'
WHERE purchase_number = 'PUR-46';

-- Check the result
SELECT 
    id,
    purchase_number,
    invoice_number,
    updated_at
FROM purchases 
WHERE invoice_number = 'TEST-7898';

-- Clean up test (optional)
UPDATE purchases 
SET invoice_number = '7898'
WHERE purchase_number = 'PUR-TEST-7898';
*/
