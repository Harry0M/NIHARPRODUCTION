-- Check what roles are allowed in your database
-- Run this first to see the valid roles

-- Method 1: Check the enum type definition
SELECT enumlabel as valid_roles 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'user_role'
)
ORDER BY enumsortorder;

-- Method 2: Check the check constraint details
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%role%';

-- Method 3: Try to see what the current constraint allows
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name = 'role';
