-- Fix for formula field being overridden by database triggers
-- This migration fixes the update_catalog_component_consumption function
-- to properly handle and preserve the formula field

CREATE OR REPLACE FUNCTION "public"."update_catalog_component_consumption"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  l_length NUMERIC;
  l_width NUMERIC;
  l_catalog_record RECORD;
  l_default_quantity INTEGER;
  l_formula TEXT;
BEGIN
  -- Preserve the formula field from the NEW record
  l_formula := COALESCE(NEW.formula, 'standard');
  
  -- If formula is 'manual', do NOT recalculate consumption - preserve what was set
  IF l_formula = 'manual' THEN
    -- Just preserve the formula and consumption as-is
    NEW.formula := 'manual';
    NEW.is_manual_consumption := true;
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
  
  -- Always preserve the formula field
  NEW.formula := l_formula;
  
  RETURN NEW;
END;
$$;

-- Add a comment explaining the function behavior
COMMENT ON FUNCTION "public"."update_catalog_component_consumption"() IS 
'Calculates consumption for catalog components based on formula type. Preserves manual consumption when formula is manual.';