-- Fix hard delete function transaction deletion issue
-- The function is deleting inventory items but not deleting transaction history properly
-- Use the same direct DELETE approach as the working individual transaction deletion

-- Drop and recreate the hard delete function with proper transaction deletion
DROP FUNCTION IF EXISTS hard_delete_inventory_with_consumption_preserve(UUID);

-- Recreated hard delete function with direct DELETE statements like individual transaction deletion
CREATE OR REPLACE FUNCTION hard_delete_inventory_with_consumption_preserve(input_inventory_id UUID)
RETURNS JSON AS $$
DECLARE
    material_record RECORD;
    deleted_transactions INTEGER := 0;
    preserved_consumption INTEGER := 0;
    modified_purchase_items INTEGER := 0;
    result_message TEXT;
BEGIN
    -- Get the inventory item details first
    SELECT id, material_name INTO material_record 
    FROM inventory 
    WHERE id = input_inventory_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found', input_inventory_id;
    END IF;
    
    BEGIN
        -- Step 1: Count what we'll preserve (consumption transactions)
        SELECT COUNT(*) INTO preserved_consumption
        FROM inventory_transactions 
        WHERE material_id = input_inventory_id 
        AND transaction_type = 'consumption';
        
        -- Step 2: Delete non-consumption transactions (purchase, adjustment, etc.)
        -- Use direct DELETE statement like the working individual transaction deletion
        DELETE FROM inventory_transactions 
        WHERE material_id = input_inventory_id 
        AND transaction_type != 'consumption';
        
        GET DIAGNOSTICS deleted_transactions = ROW_COUNT;
        
        -- Step 3: Set purchase_items material_id to NULL (preserve purchase history but break reference)
        UPDATE purchase_items 
        SET material_id = NULL 
        WHERE material_id = input_inventory_id;
        
        GET DIAGNOSTICS modified_purchase_items = ROW_COUNT;
        
        -- Step 4: Delete the inventory item itself
        DELETE FROM inventory WHERE id = input_inventory_id;
        
        -- Build success message
        result_message := format(
            'Successfully hard deleted inventory item "%s" (ID: %s). Deleted %s non-consumption transactions, preserved %s consumption transactions, modified %s purchase item references.',
            material_record.material_name,
            input_inventory_id,
            deleted_transactions,
            preserved_consumption,
            modified_purchase_items
        );
        
        RETURN json_build_object(
            'success', true,
            'message', result_message,
            'details', json_build_object(
                'inventory_id', input_inventory_id,
                'material_name', material_record.material_name,
                'deleted_transactions', deleted_transactions,
                'preserved_consumption_transactions', preserved_consumption,
                'modified_purchase_items', modified_purchase_items
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error hard deleting inventory item "%" (ID: %): %', 
            material_record.material_name, input_inventory_id, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;
