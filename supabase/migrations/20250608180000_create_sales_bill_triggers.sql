-- Migration: Create Sales Bill Triggers
-- Description: Creates the set_bill_number and update_sales_bills_updated_at functions and triggers

-- Function to auto-generate bill number
CREATE OR REPLACE FUNCTION set_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  next_number INT;
  formatted_number TEXT;
BEGIN
  -- Only set bill number if it's not provided
  IF NEW.bill_number IS NULL OR NEW.bill_number = '' THEN
    -- Get current year and month for the prefix (e.g., "2025-06" for June 2025)
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Find the highest bill number for the current month and increment
    SELECT COALESCE(MAX(
      CASE 
        WHEN bill_number LIKE year_part || '-%' 
        THEN CAST(SUBSTRING(bill_number FROM LENGTH(year_part) + 2) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_number
    FROM sales_bills
    WHERE bill_number LIKE year_part || '-%';
    
    -- Format the number part to be 3 digits with leading zeros
    formatted_number := LPAD(next_number::TEXT, 3, '0');
    
    -- Combine to create the final bill number (e.g., "2025-06-001")
    NEW.bill_number := year_part || '-' || formatted_number;
  END IF;
  
  -- Calculate financial values if not set
  IF NEW.subtotal IS NULL OR NEW.subtotal = 0 THEN
    NEW.subtotal := NEW.quantity * NEW.rate;
  END IF;
  
  IF NEW.gst_amount IS NULL OR NEW.gst_amount = 0 THEN
    NEW.gst_amount := (NEW.subtotal * NEW.gst_percentage) / 100;
  END IF;
  
  IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
    NEW.total_amount := NEW.subtotal + NEW.gst_amount + NEW.transport_charge;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating bill number on insert
CREATE TRIGGER set_bill_number_trigger
BEFORE INSERT ON sales_bills
FOR EACH ROW
EXECUTE FUNCTION set_bill_number();

-- Create trigger for updating updated_at timestamp on update
CREATE TRIGGER update_sales_bills_updated_at_trigger
BEFORE UPDATE ON sales_bills
FOR EACH ROW
EXECUTE FUNCTION update_sales_bills_updated_at();

-- Add comment to explain the triggers
COMMENT ON FUNCTION set_bill_number() IS 'Auto-generates bill numbers in the format YYYY-MM-XXX if not provided';
COMMENT ON FUNCTION update_sales_bills_updated_at() IS 'Updates the updated_at timestamp whenever a sales bill is modified';
