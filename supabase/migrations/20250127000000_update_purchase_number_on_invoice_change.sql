-- Migration: Update purchase number when invoice number changes
-- This ensures that when an invoice number is updated, the purchase number is also updated to match
-- Format: PUR-{invoice_number} when invoice_number is present, or PUR-YYYY-NNNN when not

-- Create function to update purchase number on invoice number change
CREATE OR REPLACE FUNCTION "public"."update_purchase_number_on_invoice_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  year_prefix TEXT;
  sequence_number TEXT;
  new_purchase_number TEXT;
BEGIN
  -- Only update purchase number if invoice_number has changed
  IF (TG_OP = 'UPDATE' AND OLD.invoice_number IS DISTINCT FROM NEW.invoice_number) THEN
    
    -- If invoice_number is provided, use it in the purchase number
    IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
      new_purchase_number := 'PUR-' || NEW.invoice_number;
    ELSE
      -- If invoice_number is being removed/cleared, revert to original format
      year_prefix := 'PUR-' || to_char(current_date, 'YYYY') || '-';
      sequence_number := LPAD(nextval('purchase_number_seq')::TEXT, 4, '0');
      new_purchase_number := year_prefix || sequence_number;
    END IF;
    
    NEW.purchase_number := new_purchase_number;
    
    -- Log the change for debugging
    RAISE NOTICE 'Updated purchase number from % to % due to invoice number change from % to %', 
      OLD.purchase_number, NEW.purchase_number, OLD.invoice_number, NEW.invoice_number;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION "public"."update_purchase_number_on_invoice_change"() IS 'Updates purchase number to PUR-{invoice_number} when invoice_number is changed on existing purchases';

-- Create trigger to update purchase number when invoice number changes
CREATE OR REPLACE TRIGGER "update_purchase_number_on_invoice_change_trigger" 
    BEFORE UPDATE OF "invoice_number" ON "public"."purchases" 
    FOR EACH ROW 
    EXECUTE FUNCTION "public"."update_purchase_number_on_invoice_change"();

-- Add comment to explain the trigger
COMMENT ON TRIGGER "update_purchase_number_on_invoice_change_trigger" ON "public"."purchases" IS 'Automatically updates purchase number when invoice number is changed';

-- Optional: Update existing purchases where invoice_number exists but purchase_number doesn't follow the PUR-{invoice_number} format
-- This is a one-time fix for existing data
DO $$
DECLARE
    updated_count INTEGER := 0;
    purchase_record RECORD;
BEGIN
    -- Find purchases where invoice_number exists but purchase_number doesn't match the expected format
    FOR purchase_record IN 
        SELECT id, purchase_number, invoice_number
        FROM public.purchases 
        WHERE invoice_number IS NOT NULL 
        AND invoice_number != '' 
        AND purchase_number != ('PUR-' || invoice_number)
    LOOP
        -- Update the purchase number to match the invoice number
        UPDATE public.purchases 
        SET purchase_number = 'PUR-' || purchase_record.invoice_number
        WHERE id = purchase_record.id;
        
        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Updated purchase ID % from % to PUR-%', 
            purchase_record.id, purchase_record.purchase_number, purchase_record.invoice_number;
    END LOOP;
    
    RAISE NOTICE 'Updated % existing purchases to match invoice number format', updated_count;
END;
$$;
