-- Check purchase_items table structure and constraints
SELECT 
  c.column_name,
  c.data_type,
  c.is_nullable,
  tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.column_name = c.column_name AND ccu.table_name = c.table_name
LEFT JOIN information_schema.table_constraints tc ON tc.constraint_name = ccu.constraint_name
WHERE c.table_name = 'purchase_items' 
  AND c.table_schema = 'public'
  AND c.column_name = 'material_id'
ORDER BY c.ordinal_position;

-- Also check if there are any foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'purchase_items'
  AND kcu.column_name = 'material_id';
