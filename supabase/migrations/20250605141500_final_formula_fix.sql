-- Migration: Final fix for formula field override issue
-- Date: 2025-06-05
-- Issue: Multiple conflicting triggers override formula field values in catalog_components

-- Remove all conflicting triggers that might override formula values
DROP TRIGGER IF EXISTS tr_calculate_component_consumption ON catalog_components;
DROP TRIGGER IF EXISTS catalog_component_consumption_trigger ON catalog_components;

-- Remove the problematic function that overrides formula field
DROP FUNCTION IF EXISTS calculate_component_consumption();

-- Ensure our corrected function properly preserves formula field
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
  
  -- If no formula specified, default to 'standard'
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
