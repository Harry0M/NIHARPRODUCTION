-- Run this in your Supabase SQL editor to get the exact schema
-- Copy and paste the output

-- Get cutting_jobs table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cutting_jobs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get printing_jobs table schema  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'printing_jobs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get stitching_jobs table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stitching_jobs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
