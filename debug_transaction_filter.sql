-- Debug the transaction deletion filter
-- Let's check what transactions exist for a specific inventory item and test our filter

-- First, let's see what transactions exist for any inventory item
SELECT 
    material_id,
    transaction_type,
    COUNT(*) as count
FROM inventory_transactions 
GROUP BY material_id, transaction_type
ORDER BY material_id, transaction_type
LIMIT 10;

-- Test the filter logic with a specific material_id
-- Replace 'YOUR_MATERIAL_ID_HERE' with an actual material_id from your inventory
-- SELECT 
--     transaction_type,
--     COUNT(*) as count,
--     CASE 
--         WHEN transaction_type NOT IN ('consumption', 'purchase') THEN 'WILL BE DELETED'
--         ELSE 'WILL BE PRESERVED'
--     END as action
-- FROM inventory_transactions 
-- WHERE material_id = 'YOUR_MATERIAL_ID_HERE'
-- GROUP BY transaction_type
-- ORDER BY transaction_type;
