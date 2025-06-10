-- Fix hard delete function by removing catalog_materials references
-- The function was trying to reference a table that doesn't exist

-- Drop and recreate the hard delete function without catalog references
DROP FUNCTION IF EXISTS hard_delete_inventory_with_consumption_preserve(UUID);
DROP FUNCTION IF EXISTS preview_inventory_hard_deletion(UUID);

-- Recreated preview function without catalog references
CREATE OR REPLACE FUNCTION preview_inventory_hard_deletion(input_inventory_id UUID)
RETURNS JSON AS $$
DECLARE
    material_record RECORD;
    deletion_count INTEGER;
    consumption_count INTEGER;
    purchase_items_count INTEGER;
    result JSON;
BEGIN
    -- Get the inventory item details
    SELECT id, material_name INTO material_record 
    FROM inventory 
    WHERE id = input_inventory_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found', input_inventory_id;
    END IF;
    
    -- Count non-consumption transactions that will be deleted
    SELECT COUNT(*) INTO deletion_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type != 'consumption';
    
    -- Count consumption transactions that will be preserved
    SELECT COUNT(*) INTO consumption_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'consumption';
    
    -- Count purchase items that will lose material reference
    SELECT COUNT(*) INTO purchase_items_count
    FROM purchase_items 
    WHERE material_id = input_inventory_id;
    
    -- Build result JSON
    result := json_build_object(
        'inventory_id', input_inventory_id,
        'material_name', material_record.material_name,
        'deletion_preview', json_build_object(
            'will_be_deleted', json_build_object(
                'inventory_item', true,
                'non_consumption_transactions', deletion_count
            ),
            'will_be_preserved', json_build_object(
                'consumption_transactions', consumption_count,
                'purchase_history', purchase_items_count,
                'order_history', 0
            ),
            'will_be_modified', json_build_object(
                'purchase_items_lose_material_ref', purchase_items_count,
                'order_components_lose_material_ref', 0
            )
        ),
        'summary', format('Will hard delete inventory item "%s" and %s non-consumption transactions. %s consumption transactions and %s purchase records will be preserved.',
            material_record.material_name,
            deletion_count,
            consumption_count,
            purchase_items_count
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Recreated hard delete function without catalog references
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
        -- Step 1: Count what we'll preserve
        SELECT COUNT(*) INTO preserved_consumption
        FROM inventory_transactions 
        WHERE material_id = input_inventory_id 
        AND transaction_type = 'consumption';
        
        -- Step 2: Delete non-consumption transactions (purchase, adjustment, etc.)
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
