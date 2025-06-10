-- Test hard delete with a specific inventory item to see what happens
-- Replace the UUID below with an actual inventory item ID from your database

-- First, let's create a test function to simulate what the hard delete would do
CREATE OR REPLACE FUNCTION test_hard_delete_simulation(input_inventory_id UUID)
RETURNS JSON AS $$
DECLARE
    material_record RECORD;
    total_transactions INTEGER := 0;
    consumption_transactions INTEGER := 0;
    purchase_transactions INTEGER := 0;
    adjustment_transactions INTEGER := 0;
    to_be_deleted INTEGER := 0;
    result JSON;
BEGIN
    -- Get the inventory item details
    SELECT id, material_name INTO material_record 
    FROM inventory 
    WHERE id = input_inventory_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found', input_inventory_id;
    END IF;
    
    -- Count all transactions by type
    SELECT COUNT(*) INTO total_transactions
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id;
    
    SELECT COUNT(*) INTO consumption_transactions
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'consumption';
    
    SELECT COUNT(*) INTO purchase_transactions
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'purchase';
    
    SELECT COUNT(*) INTO adjustment_transactions
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'adjustment';
    
    -- Count what would be deleted (NOT consumption and NOT purchase)
    SELECT COUNT(*) INTO to_be_deleted
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type NOT IN ('consumption', 'purchase');
    
    -- Build result
    result := json_build_object(
        'inventory_id', input_inventory_id,
        'material_name', material_record.material_name,
        'transaction_breakdown', json_build_object(
            'total_transactions', total_transactions,
            'consumption_transactions', consumption_transactions,
            'purchase_transactions', purchase_transactions,
            'adjustment_transactions', adjustment_transactions,
            'transactions_to_be_deleted', to_be_deleted
        ),
        'filter_test', json_build_object(
            'filter_condition', 'transaction_type NOT IN (''consumption'', ''purchase'')',
            'would_delete_count', to_be_deleted,
            'explanation', CASE 
                WHEN to_be_deleted = 0 THEN 'No transactions would be deleted (only consumption/purchase exist)'
                ELSE format('%s transactions would be deleted (adjustment or other types)', to_be_deleted)
            END
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Usage example (uncomment and replace with real inventory ID):
-- SELECT test_hard_delete_simulation('YOUR_INVENTORY_ID_HERE');
