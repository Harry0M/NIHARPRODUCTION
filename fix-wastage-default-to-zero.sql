-- Fix wastage percentage default from 5.0 to 0.0
-- This script updates the database to set wastage default to 0% instead of 5%

-- 1. Update the column default value
ALTER TABLE public.orders ALTER COLUMN wastage_percentage SET DEFAULT 0.0;

-- 2. Update the trigger function to use 0.0 instead of 5.0
CREATE OR REPLACE FUNCTION calculate_order_wastage_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate wastage cost based on percentage and material cost
    -- Use 0.0 as default instead of 5.0 when wastage_percentage is NULL
    NEW.wastage_cost = (COALESCE(NEW.material_cost, 0) * COALESCE(NEW.wastage_percentage, 0.0) / 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Optionally, you can reset existing orders with 5% wastage to 0%
-- Uncomment the following lines if you want to reset existing orders to 0% wastage:
/*
UPDATE public.orders 
SET 
    wastage_percentage = 0.0,
    wastage_cost = 0.0
WHERE wastage_percentage = 5.0;
*/

-- Verify the changes
SELECT 
    column_name,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('wastage_percentage', 'wastage_cost');
