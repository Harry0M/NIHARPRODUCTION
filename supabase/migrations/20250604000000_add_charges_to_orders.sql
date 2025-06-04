-- Add explicit comments about charge fields
ALTER TABLE orders
  ALTER COLUMN cutting_charge SET DEFAULT 0,
  ALTER COLUMN printing_charge SET DEFAULT 0,
  ALTER COLUMN stitching_charge SET DEFAULT 0,
  ALTER COLUMN transport_charge SET DEFAULT 0;

-- Relax constraint to allow both null (temporary orders) and both set
ALTER TABLE orders DROP CONSTRAINT company_name_or_id;

ALTER TABLE orders
  ADD CONSTRAINT company_name_or_id_new CHECK (
    (company_name IS NOT NULL AND company_id IS NULL) OR
    (company_name IS NULL AND company_id IS NOT NULL) OR
    (company_name IS NULL AND company_id IS NULL) OR
    (company_name IS NOT NULL AND company_id IS NOT NULL)
  );

-- Create helper function for charge validation
CREATE OR REPLACE FUNCTION validate_charge_values() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cutting_charge < 0 OR
     NEW.printing_charge < 0 OR
     NEW.stitching_charge < 0 OR
     NEW.transport_charge < 0 
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22013',
      MESSAGE = 'Charge values cannot be negative',
      DETAIL = FORMAT('Received values: cutting=%s, printing=%s, stitching=%s, transport=%s', 
                     NEW.cutting_charge, NEW.printing_charge, NEW.stitching_charge, NEW.transport_charge);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if needed
DROP TRIGGER IF EXISTS validate_charges ON orders;

-- Then create the new trigger
CREATE TRIGGER validate_charges
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_charge_values();
