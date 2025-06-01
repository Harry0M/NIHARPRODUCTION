-- Migration to update the generate_purchase_number function to incorporate invoice_number
-- when available in the purchase_number format

CREATE OR REPLACE FUNCTION public.generate_purchase_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix TEXT;
  sequence_number TEXT;
  new_purchase_number TEXT;
BEGIN
  -- If invoice_number is provided, use it in the purchase number
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    new_purchase_number := 'PUR-' || NEW.invoice_number;
  ELSE
    -- Otherwise use the original format with sequence number
    year_prefix := 'PUR-' || to_char(current_date, 'YYYY') || '-';
    sequence_number := LPAD(nextval('purchase_number_seq')::TEXT, 4, '0');
    new_purchase_number := year_prefix || sequence_number;
  END IF;
  
  NEW.purchase_number := new_purchase_number;
  RETURN NEW;
END;
$$;

-- Ensure function ownership is set correctly
ALTER FUNCTION public.generate_purchase_number() OWNER TO postgres;

-- Re-grant permissions
GRANT ALL ON FUNCTION public.generate_purchase_number() TO anon;
GRANT ALL ON FUNCTION public.generate_purchase_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_purchase_number() TO service_role;
