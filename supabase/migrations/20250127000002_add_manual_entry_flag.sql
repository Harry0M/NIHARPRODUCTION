-- Migration: Add is_manual_entry column to track manual inventory entries
-- This will help identify entries created during stock creation or manual edits

-- Add the is_manual_entry column to inventory_transaction_log
ALTER TABLE "public"."inventory_transaction_log" 
ADD COLUMN "is_manual_entry" boolean DEFAULT false;

-- Add index for performance when querying manual entries
CREATE INDEX "idx_inventory_transaction_log_manual_entries" 
ON "public"."inventory_transaction_log" ("material_id", "is_manual_entry", "transaction_date") 
WHERE "is_manual_entry" = true;

-- Update existing records that should be marked as manual entries
-- Mark entries that look like initial stock creation or manual adjustments
UPDATE "public"."inventory_transaction_log" 
SET "is_manual_entry" = true 
WHERE 
  "transaction_type" ILIKE '%manual%' 
  OR "transaction_type" ILIKE '%adjustment%'
  OR "transaction_type" ILIKE '%initial%'
  OR "transaction_type" ILIKE '%creation%'
  OR "notes" ILIKE '%manual%'
  OR "notes" ILIKE '%initial%'
  OR "notes" ILIKE '%created%'
  OR ("metadata"->>'manual')::boolean = true
  OR "metadata"->>'update_source' ILIKE '%manual%';

-- Add comment explaining the column
COMMENT ON COLUMN "public"."inventory_transaction_log"."is_manual_entry" 
IS 'Indicates if this transaction was a manual entry (stock creation, manual edit) vs automatic (order consumption, etc.)';

-- Create a function to record manual inventory transactions
CREATE OR REPLACE FUNCTION "public"."record_manual_inventory_transaction"(
    "p_material_id" "uuid",
    "p_transaction_type" "text",
    "p_quantity" numeric,
    "p_previous_quantity" numeric,
    "p_new_quantity" numeric,
    "p_notes" "text" DEFAULT NULL,
    "p_reference_id" "text" DEFAULT NULL,
    "p_reference_number" "text" DEFAULT NULL,
    "p_metadata" "jsonb" DEFAULT NULL
) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Insert the manual transaction record
    INSERT INTO "public"."inventory_transaction_log" (
        "material_id",
        "transaction_type",
        "quantity",
        "previous_quantity",
        "new_quantity",
        "reference_id",
        "reference_number",
        "reference_type",
        "notes",
        "metadata",
        "is_manual_entry",
        "created_by"
    ) VALUES (
        p_material_id,
        p_transaction_type,
        p_quantity,
        p_previous_quantity,
        p_new_quantity,
        p_reference_id,
        p_reference_number,
        'Manual',
        p_notes,
        COALESCE(p_metadata, '{}'),
        true, -- This is a manual entry
        auth.uid() -- Current user if available
    ) RETURNING "id" INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Add comment for the function
COMMENT ON FUNCTION "public"."record_manual_inventory_transaction" 
IS 'Records a manual inventory transaction (stock creation, manual edits) with is_manual_entry = true';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added is_manual_entry column to inventory_transaction_log table';
END
$$;
