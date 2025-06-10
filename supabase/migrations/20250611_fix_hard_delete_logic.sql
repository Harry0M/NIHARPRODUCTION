-- Fix for inventory hard delete logic
-- Correct approach: Keep purchase records intact, only delete transaction history

-- Drop the existing function first
DROP FUNCTION IF EXISTS hard_delete_inventory_with_consumption_preserve(UUID);
DROP FUNCTION IF EXISTS preview_inventory_hard_deletion(UUID);

-- Create the corrected preview function
CREATE OR REPLACE FUNCTION preview_inventory_hard_deletion(input_inventory_id UUID)
RETURNS JSON AS $$
DECLARE
    material_info RECORD;
    inventory_count INTEGER;
    purchase_transaction_count INTEGER;
    adjustment_transaction_count INTEGER;
    consumption_transaction_count INTEGER;
    catalog_refs_count INTEGER;
    purchase_items_count INTEGER;
    order_components_count INTEGER;
    result JSON;
BEGIN
    -- Validate input
    IF input_inventory_id IS NULL THEN
        RAISE EXCEPTION 'Inventory ID cannot be null';
    END IF;

    -- Check if inventory item exists
    SELECT material_name INTO material_info
    FROM inventory 
    WHERE id = input_inventory_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found or already deleted', input_inventory_id;
    END IF;

    -- Count what will be deleted
    SELECT COUNT(*) INTO inventory_count
    FROM inventory 
    WHERE id = input_inventory_id;

    -- Count purchase transactions (will be deleted)
    SELECT COUNT(*) INTO purchase_transaction_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'purchase';

    -- Count adjustment transactions (will be deleted)
    SELECT COUNT(*) INTO adjustment_transaction_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'adjustment';

    -- Count consumption transactions (will be preserved)
    SELECT COUNT(*) INTO consumption_transaction_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'consumption';

    -- Count catalog material references (will be deleted)
    SELECT COUNT(*) INTO catalog_refs_count
    FROM catalog_materials 
    WHERE material_id = input_inventory_id;

    -- Count purchase items (will be preserved but lose material reference)
    SELECT COUNT(*) INTO purchase_items_count
    FROM purchase_items 
    WHERE material_id = input_inventory_id;

    -- Count order components (will be preserved but lose material reference)
    SELECT COUNT(*) INTO order_components_count
    FROM order_components 
    WHERE material_id = input_inventory_id;

    -- Build the result JSON
    SELECT json_build_object(
        'inventory_id', input_inventory_id,
        'material_name', material_info.material_name,
        'deletion_preview', json_build_object(
            'will_be_deleted', json_build_object(
                'inventory_item', true,
                'purchase_transactions', purchase_transaction_count,
                'adjustment_transactions', adjustment_transaction_count,
                'catalog_material_references', catalog_refs_count
            ),
            'will_be_preserved', json_build_object(
                'consumption_transactions', consumption_transaction_count,
                'purchase_records', purchase_items_count,
                'order_records', order_components_count
            ),
            'will_be_modified', json_build_object(
                'purchase_items_lose_material_ref', purchase_items_count,
                'order_components_lose_material_ref', order_components_count
            )
        ),
        'summary', format(
            'Will delete: inventory item, %s purchase transactions, %s adjustment transactions, %s catalog references. Will preserve: %s consumption transactions, %s purchase records, %s order records.',
            purchase_transaction_count,
            adjustment_transaction_count,
            catalog_refs_count,
            consumption_transaction_count,
            purchase_items_count,
            order_components_count
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the corrected hard delete function
CREATE OR REPLACE FUNCTION hard_delete_inventory_with_consumption_preserve(input_inventory_id UUID)
RETURNS JSON AS $$
DECLARE
    material_info RECORD;
    deleted_purchase_transactions INTEGER := 0;
    deleted_adjustment_transactions INTEGER := 0;
    deleted_catalog_refs INTEGER := 0;
    modified_purchase_items INTEGER := 0;
    modified_order_components INTEGER := 0;
    preserved_consumption_transactions INTEGER := 0;
    result JSON;
BEGIN
    -- Validate input
    IF input_inventory_id IS NULL THEN
        RAISE EXCEPTION 'Inventory ID cannot be null';
    END IF;

    -- Get material info before deletion
    SELECT material_name INTO material_info
    FROM inventory 
    WHERE id = input_inventory_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found or already deleted', input_inventory_id;
    END IF;

    -- Count consumption transactions we'll preserve
    SELECT COUNT(*) INTO preserved_consumption_transactions
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'consumption';

    -- Step 1: Delete purchase transactions (not the purchase records themselves)
    DELETE FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'purchase';
    GET DIAGNOSTICS deleted_purchase_transactions = ROW_COUNT;

    -- Step 2: Delete adjustment transactions
    DELETE FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'adjustment';
    GET DIAGNOSTICS deleted_adjustment_transactions = ROW_COUNT;

    -- Step 3: Delete catalog material references
    DELETE FROM catalog_materials 
    WHERE material_id = input_inventory_id;
    GET DIAGNOSTICS deleted_catalog_refs = ROW_COUNT;

    -- Step 4: Update purchase_items to remove material reference (set to NULL)
    -- This preserves the purchase records but breaks the reference to deleted inventory
    UPDATE purchase_items 
    SET material_id = NULL 
    WHERE material_id = input_inventory_id;
    GET DIAGNOSTICS modified_purchase_items = ROW_COUNT;

    -- Step 5: Update order_components to remove material reference (set to NULL)
    -- This preserves the order records but breaks the reference to deleted inventory
    UPDATE order_components 
    SET material_id = NULL 
    WHERE material_id = input_inventory_id;
    GET DIAGNOSTICS modified_order_components = ROW_COUNT;

    -- Step 6: Finally delete the inventory item itself
    DELETE FROM inventory 
    WHERE id = input_inventory_id;

    -- Build the success response
    SELECT json_build_object(
        'success', true,
        'inventory_id', input_inventory_id,
        'material_name', material_info.material_name,
        'deletion_summary', json_build_object(
            'deleted', json_build_object(
                'inventory_item', 1,
                'purchase_transactions', deleted_purchase_transactions,
                'adjustment_transactions', deleted_adjustment_transactions,
                'catalog_references', deleted_catalog_refs
            ),
            'preserved', json_build_object(
                'consumption_transactions', preserved_consumption_transactions,
                'purchase_records', modified_purchase_items,
                'order_records', modified_order_components
            ),
            'modified', json_build_object(
                'purchase_items_nullified', modified_purchase_items,
                'order_components_nullified', modified_order_components
            )
        ),
        'message', format(
            'Successfully hard deleted inventory item "%s". Deleted %s purchase transactions, %s adjustment transactions, %s catalog references. Preserved %s consumption transactions. Modified %s purchase items and %s order components to remove material reference.',
            material_info.material_name,
            deleted_purchase_transactions,
            deleted_adjustment_transactions,
            deleted_catalog_refs,
            preserved_consumption_transactions,
            modified_purchase_items,
            modified_order_components
        )
    ) INTO result;

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise with context
        RAISE EXCEPTION 'Error hard deleting inventory item "%" (ID: %): %', 
            COALESCE(material_info.material_name, 'Unknown'), 
            input_inventory_id, 
            SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION preview_inventory_hard_deletion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hard_delete_inventory_with_consumption_preserve(UUID) TO authenticated;
