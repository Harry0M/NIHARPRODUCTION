-- Test script to verify the job number format change
-- Run this in Supabase SQL Editor to test the new format

-- 1. Check current job cards and their job numbers
SELECT 
    jc.id,
    jc.job_name,
    jc.job_number,
    jc.order_id,
    o.order_number,
    CASE 
        WHEN jc.job_number = ('JOB-' || o.order_number) THEN 'NEW FORMAT ✅'
        ELSE 'OLD FORMAT ⚠️'
    END as format_status,
    jc.created_at
FROM job_cards jc
LEFT JOIN orders o ON jc.order_id = o.id
ORDER BY jc.created_at DESC
LIMIT 10;

-- 2. Check if the function exists and is updated
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'generate_job_number' 
AND routine_schema = 'public';

-- 3. Show recent orders that can be used for testing
SELECT 
    id,
    order_number,
    company_name,
    'JOB-' || order_number as expected_job_number,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
