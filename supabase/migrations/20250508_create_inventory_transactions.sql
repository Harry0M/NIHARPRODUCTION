
-- Create inventory transactions table to track material usage
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'consumption', 'adjustment', 'return')),
    quantity NUMERIC NOT NULL,
    reference_type TEXT, -- e.g., 'order', 'purchase', 'adjustment'
    reference_id TEXT, -- ID or number related to the reference_type
    notes TEXT,
    created_by UUID REFERENCES auth.users(id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON public.inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON public.inventory_transactions(reference_type, reference_id);

-- Grant permissions
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read for authenticated users" 
ON public.inventory_transactions 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.inventory_transactions 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Update inventory trigger function (create if it doesn't exist)
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory quantity when a transaction is recorded
    UPDATE public.inventory
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.inventory_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_update_inventory_on_transaction ON public.inventory_transactions;
CREATE TRIGGER trigger_update_inventory_on_transaction
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_transaction();
