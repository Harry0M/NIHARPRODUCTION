-- Migration: Create job_card_consumptions table
-- Purpose: Store actual consumption amounts per job card at creation time
-- This ensures accurate reversal regardless of order edits

CREATE TABLE IF NOT EXISTS public.job_card_consumptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  consumption_amount DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  
  -- Additional context for audit and debugging
  material_name TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  
  -- Metadata for comprehensive tracking
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_consumption CHECK (consumption_amount > 0),
  CONSTRAINT unique_job_card_material UNIQUE (job_card_id, material_id, component_type)
);

-- Create indexes for performance
CREATE INDEX idx_job_card_consumptions_job_card_id ON public.job_card_consumptions(job_card_id);
CREATE INDEX idx_job_card_consumptions_material_id ON public.job_card_consumptions(material_id);
CREATE INDEX idx_job_card_consumptions_order_id ON public.job_card_consumptions(order_id);

-- RLS (Row Level Security) policies
ALTER TABLE public.job_card_consumptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select, insert, update, delete
CREATE POLICY "Allow authenticated users full access to job_card_consumptions"
ON public.job_card_consumptions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.job_card_consumptions IS 'Stores actual material consumption amounts for each job card at creation time. Used for accurate inventory reversal during job card deletion.';

COMMENT ON COLUMN public.job_card_consumptions.consumption_amount IS 'Actual amount consumed when job card was created (not current order component amount)';
COMMENT ON COLUMN public.job_card_consumptions.metadata IS 'Additional context like color, GSM, etc. in JSON format';
