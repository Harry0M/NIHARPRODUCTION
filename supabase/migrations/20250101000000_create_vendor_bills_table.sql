-- Migration: Create vendor_bills table for vendor billing system
-- This table stores bills generated for vendors based on completed jobs (cutting, printing, stitching)

CREATE TABLE IF NOT EXISTS public.vendor_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Bill identification
  bill_number TEXT UNIQUE NOT NULL,
  
  -- Vendor information
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  vendor_name TEXT NOT NULL,
  
  -- Job information
  job_id UUID NOT NULL, -- Can reference cutting_jobs, printing_jobs, or stitching_jobs
  job_type TEXT NOT NULL CHECK (job_type IN ('cutting', 'printing', 'stitching')),
  job_number TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_number TEXT,
  
  -- Product details
  product_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  
  -- Billing details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
  
  -- Financial calculations
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  gst_percentage DECIMAL(5,2) DEFAULT 0 CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
  gst_amount DECIMAL(10,2) DEFAULT 0 CHECK (gst_amount >= 0),
  other_expenses DECIMAL(10,2) DEFAULT 0 CHECK (other_expenses >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Status and metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  
  -- Timestamps and audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_vendor_bills_vendor_id ON public.vendor_bills(vendor_id);
CREATE INDEX idx_vendor_bills_job_type_id ON public.vendor_bills(job_type, job_id);
CREATE INDEX idx_vendor_bills_order_id ON public.vendor_bills(order_id);
CREATE INDEX idx_vendor_bills_status ON public.vendor_bills(status);
CREATE INDEX idx_vendor_bills_created_at ON public.vendor_bills(created_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_bills_updated_at_trigger
  BEFORE UPDATE ON public.vendor_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_bills_updated_at();

-- Auto-generate bill numbers in format VB-YYYY-MM-XXX
CREATE OR REPLACE FUNCTION set_vendor_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Only generate bill number if not provided
  IF NEW.bill_number IS NULL OR NEW.bill_number = '' THEN
    -- Get current year and month for the prefix (e.g., "2025-01" for January 2025)
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Find the highest bill number for the current month and increment
    SELECT COALESCE(MAX(
      CASE 
        WHEN bill_number LIKE 'VB-' || year_part || '-%' 
        THEN CAST(SUBSTRING(bill_number FROM LENGTH('VB-' || year_part) + 2) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_number
    FROM vendor_bills
    WHERE bill_number LIKE 'VB-' || year_part || '-%';
    
    -- Format the number part to be 3 digits with leading zeros
    formatted_number := LPAD(next_number::TEXT, 3, '0');
    
    -- Combine to create the final bill number (e.g., "VB-2025-01-001")
    NEW.bill_number := 'VB-' || year_part || '-' || formatted_number;
  END IF;
  
  -- Calculate financial values if not set
  IF NEW.subtotal IS NULL OR NEW.subtotal = 0 THEN
    NEW.subtotal := NEW.quantity * NEW.rate;
  END IF;
  
  IF NEW.gst_amount IS NULL OR NEW.gst_amount = 0 THEN
    NEW.gst_amount := (NEW.subtotal * NEW.gst_percentage) / 100;
  END IF;
  
  IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
    NEW.total_amount := NEW.subtotal + NEW.gst_amount + NEW.other_expenses;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vendor_bill_number_trigger
  BEFORE INSERT OR UPDATE ON public.vendor_bills
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_bill_number();

-- RLS (Row Level Security) policies
ALTER TABLE public.vendor_bills ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to vendor_bills"
ON public.vendor_bills
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.vendor_bills IS 'Stores vendor bills generated for completed production jobs (cutting, printing, stitching)';
COMMENT ON COLUMN public.vendor_bills.bill_number IS 'Auto-generated bill number in format VB-YYYY-MM-XXX';
COMMENT ON COLUMN public.vendor_bills.job_id IS 'References the specific job (cutting_jobs.id, printing_jobs.id, or stitching_jobs.id)';
COMMENT ON COLUMN public.vendor_bills.job_type IS 'Type of job: cutting, printing, or stitching';
COMMENT ON COLUMN public.vendor_bills.quantity IS 'Quantity of work completed (received_quantity from job)';
COMMENT ON COLUMN public.vendor_bills.rate IS 'Rate per unit for the job';
