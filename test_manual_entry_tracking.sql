-- Test script to verify manual inventory entry tracking
-- This script tests the new is_manual_entry column and function

-- 1. Check if the is_manual_entry column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'inventory_transaction_log' 
  AND column_name = 'is_manual_entry';

-- 2. Check if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'record_manual_inventory_transaction';

-- 3. First, let's see what columns actually exist in the table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_transaction_log' 
ORDER BY ordinal_position;

-- 4. Check existing manual entries (using correct column name)
SELECT 
  id,
  material_id,
  transaction_type,
  quantity,
  previous_quantity,
  new_quantity,
  is_manual_entry,
  notes,
  transaction_date  -- Using transaction_date instead of created_at
FROM inventory_transaction_log 
WHERE is_manual_entry = true
ORDER BY transaction_date DESC
LIMIT 10;

-- 5. Count manual vs non-manual entries
SELECT 
  is_manual_entry,
  COUNT(*) as entry_count
FROM inventory_transaction_log 
GROUP BY is_manual_entry;

-- 6. Show recent entries to see the pattern
SELECT 
  transaction_type,
  is_manual_entry,
  notes,
  transaction_date
FROM inventory_transaction_log 
ORDER BY transaction_date DESC
LIMIT 20;

-- 7. Show the index for performance
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'inventory_transaction_log' 
  AND indexname = 'idx_inventory_transaction_log_manual_entries';
