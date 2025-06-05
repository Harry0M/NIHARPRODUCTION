-- Migration: Fix formula field override by removing conflicting triggers
-- Date: 2025-06-05
-- Issue: Multiple triggers on catalog_components table are conflicting and overriding formula field values

-- Remove the problematic trigger that overrides formula field
DROP TRIGGER IF EXISTS tr_calculate_component_consumption ON catalog_components;

-- Remove duplicate trigger to avoid conflicts  
DROP TRIGGER IF EXISTS catalog_component_consumption_trigger ON catalog_components;

-- Keep only the main trigger: calculate_catalog_consumption
-- This trigger uses update_catalog_component_consumption() function which properly preserves formula field

-- Verify our corrected function is still in place
-- The update_catalog_component_consumption() function should:
-- 1. Preserve formula field from user input
-- 2. Only recalculate consumption for non-manual formulas
-- 3. Set is_manual_consumption flag correctly

-- Note: If the update_catalog_component_consumption function still needs to be updated,
-- uncomment and run the following replacement:

/*
CREATE OR REPLACE FUNCTION update_catalog_component_consumption()
RETURNS TRIGGER AS $$
DECLARE
  l_length NUMERIC;
  l_width NUMERIC;
  l_catalog_record RECORD;
  l_default_quantity INTEGER;
  l_formula TEXT;
BEGIN
  -- Preserve the formula field from the NEW record - THIS IS THE KEY FIX
  l_formula := NEW.formula;
  
  -- If no formula specified, default to 'standard' but preserve user input
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
*/
