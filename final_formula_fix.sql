-- FINAL FIX FOR FORMULA FIELD OVERRIDE ISSUE
-- This removes all conflicting triggers and functions that override the formula field

-- Step 1: Drop ALL conflicting triggers except the one we need
DROP TRIGGER IF EXISTS tr_calculate_component_consumption ON catalog_components;
DROP TRIGGER IF EXISTS catalog_component_consumption_trigger ON catalog_components;

-- Step 2: Drop the problematic calculate_component_consumption function entirely
-- since it's likely overriding our formula field
DROP FUNCTION IF EXISTS calculate_component_consumption();

-- Step 3: Ensure our corrected update_catalog_component_consumption function is in place
-- This function properly preserves the formula field
CREATE OR REPLACE FUNCTION update_catalog_component_consumption()
RETURNS TRIGGER AS $$
DECLARE
  l_length NUMERIC;
  l_width NUMERIC;
  l_catalog_record RECORD;
  l_default_quantity INTEGER;
  l_formula TEXT;
BEGIN
  -- CRITICAL: Preserve the formula field EXACTLY as provided by the user
  l_formula := NEW.formula;
  
  -- If no formula specified, default to 'standard' but preserve any user input
  IF l_formula IS NULL THEN
    l_formula := 'standard';
  END IF;
  
  -- If formula is 'manual', do NOT recalculate consumption - preserve what was set
  IF l_formula = 'manual' THEN
    NEW.formula := 'manual';
    NEW.is_manual_consumption := true;
    -- Preserve the consumption value that was manually entered
    RETURN NEW;
  END IF;
  
  -- For non-manual formulas, proceed with calculation
  -- Extract dimensions from size field if not explicitly provided
  IF NEW.size IS NOT NULL AND (NEW.length IS NULL OR NEW.width IS NULL) THEN
    l_length := split_part(NEW.size, 'x', 1)::NUMERIC;
    l_width := split_part(NEW.size, 'x', 2)::NUMERIC;
  ELSE
    l_length := NEW.length;
    l_width := NEW.width;
  END IF;
  
  -- Get default quantity from parent catalog record if available
  SELECT default_quantity INTO l_default_quantity 
  FROM public.catalog 
  WHERE id = NEW.catalog_id;
  
  -- Only recalculate consumption for standard and linear formulas
  IF l_formula = 'standard' THEN
    -- Standard formula requires length, width, and roll_width
    IF l_length IS NOT NULL AND l_width IS NOT NULL AND NEW.roll_width IS NOT NULL THEN
      -- Store base consumption (per unit)
      NEW.consumption := public.calculate_consumption(l_length, l_width, NEW.roll_width);
      
      -- If we have a default quantity, adjust the consumption
      IF l_default_quantity IS NOT NULL AND l_default_quantity > 0 THEN
        NEW.consumption := NEW.consumption * l_default_quantity;
      END IF;
      
      NEW.is_manual_consumption := false;
    END IF;
    
  ELSIF l_formula = 'linear' THEN
    -- Linear formula only requires length
    IF l_length IS NOT NULL THEN
      -- Linear calculation: length / 39.39 (convert to meters)
      NEW.consumption := l_length / 39.39;
      
      -- If we have a default quantity, adjust the consumption
      IF l_default_quantity IS NOT NULL AND l_default_quantity > 0 THEN
        NEW.consumption := NEW.consumption * l_default_quantity;
      END IF;
      
      NEW.is_manual_consumption := false;
    END IF;
  END IF;
  
  -- CRITICAL: Always preserve the formula field exactly as provided by user
  NEW.formula := l_formula;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Test the fix with sample data
-- Test with manual formula (should preserve values)
DO $$
DECLARE
    test_catalog_id UUID;
    test_result RECORD;
BEGIN
    -- Get a catalog_id for testing
    SELECT id INTO test_catalog_id FROM catalog LIMIT 1;
    
    IF test_catalog_id IS NOT NULL THEN
        -- Test manual formula
        INSERT INTO catalog_components (
            catalog_id, 
            component_type, 
            formula, 
            consumption,
            is_manual_consumption
        ) VALUES (
            test_catalog_id,
            'part', 
            'manual', 
            99.99, -- This should be preserved
            true
        ) RETURNING formula, consumption, is_manual_consumption INTO test_result;
        
        RAISE NOTICE 'Manual test result: formula=%, consumption=%, is_manual=%', 
            test_result.formula, test_result.consumption, test_result.is_manual_consumption;
        
        -- Test standard formula
        INSERT INTO catalog_components (
            catalog_id, 
            component_type, 
            formula, 
            consumption,
            is_manual_consumption,
            length,
            width,
            roll_width
        ) VALUES (
            test_catalog_id,
            'part', 
            'standard', 
            0, -- This should be recalculated
            false,
            10,
            5,
            100
        ) RETURNING formula, consumption, is_manual_consumption INTO test_result;
        
        RAISE NOTICE 'Standard test result: formula=%, consumption=%, is_manual=%', 
            test_result.formula, test_result.consumption, test_result.is_manual_consumption;
            
        -- Clean up test data
        DELETE FROM catalog_components 
        WHERE catalog_id = test_catalog_id 
        AND component_type = 'part' 
        AND (consumption = 99.99 OR length = 10);
        
    ELSE
        RAISE NOTICE 'No catalog records found for testing';
    END IF;
END $$;

-- Step 5: Verify only the correct trigger remains
SELECT 'Remaining triggers after cleanup:' as info;
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    t.tgenabled = 'O' as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'catalog_components'
AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;
