-- Add formula column to catalog_components table
ALTER TABLE catalog_components ADD COLUMN IF NOT EXISTS formula TEXT;

-- Update existing components to use standard formula as default
UPDATE catalog_components SET formula = 'standard' WHERE formula IS NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN catalog_components.formula IS 'Specifies the formula to use for material consumption calculation (standard or linear)';
