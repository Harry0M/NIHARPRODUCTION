-- Create a junction table to track all suppliers who have provided a specific material
CREATE TABLE IF NOT EXISTS material_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    last_purchase_date TIMESTAMPTZ,
    purchase_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(material_id, supplier_id)
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_material_suppliers_material_id ON material_suppliers(material_id);
CREATE INDEX IF NOT EXISTS idx_material_suppliers_supplier_id ON material_suppliers(supplier_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_material_suppliers_updated_at
BEFORE UPDATE ON material_suppliers
FOR EACH ROW
EXECUTE FUNCTION update_material_suppliers_updated_at();

-- Add a function to set a default supplier for a material
CREATE OR REPLACE FUNCTION set_default_material_supplier(p_material_id UUID, p_supplier_id UUID)
RETURNS VOID AS $$
BEGIN
    -- First, unset any existing default suppliers for this material
    UPDATE material_suppliers
    SET is_default = FALSE
    WHERE material_id = p_material_id;
    
    -- Then set the new default supplier
    UPDATE material_suppliers
    SET is_default = TRUE
    WHERE material_id = p_material_id AND supplier_id = p_supplier_id;
    
    -- Update the main inventory record to reflect the default supplier
    UPDATE inventory
    SET supplier_id = p_supplier_id
    WHERE id = p_material_id;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to maintain consistency when a purchase is made
CREATE OR REPLACE FUNCTION update_material_supplier_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- If this is a completed purchase, update or create the material_suppliers record
    IF NEW.status = 'completed' THEN
        -- For each purchase item
        FOR item_record IN 
            SELECT pi.material_id, pi.unit_price, p.supplier_id
            FROM purchase_items pi
            JOIN purchases p ON pi.purchase_id = p.id
            WHERE p.id = NEW.id
        LOOP
            -- Insert or update the material_suppliers record
            INSERT INTO material_suppliers (
                material_id, supplier_id, last_purchase_date, purchase_price
            ) VALUES (
                item_record.material_id,
                item_record.supplier_id,
                NOW(),
                item_record.unit_price
            )
            ON CONFLICT (material_id, supplier_id) 
            DO UPDATE SET
                last_purchase_date = NOW(),
                purchase_price = item_record.unit_price;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the purchases table
CREATE TRIGGER update_material_supplier_on_purchase
AFTER UPDATE ON purchases
FOR EACH ROW
WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION update_material_supplier_on_purchase();
