-- Add vendor_id column to cutting_jobs table
ALTER TABLE public.cutting_jobs 
ADD COLUMN vendor_id uuid NULL,
ADD CONSTRAINT cutting_jobs_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL;

-- Add vendor_id column to printing_jobs table
ALTER TABLE public.printing_jobs 
ADD COLUMN vendor_id uuid NULL,
ADD CONSTRAINT printing_jobs_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL;

-- Add vendor_id column to stitching_jobs table
ALTER TABLE public.stitching_jobs 
ADD COLUMN vendor_id uuid NULL,
ADD CONSTRAINT stitching_jobs_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS cutting_jobs_vendor_id_idx ON public.cutting_jobs USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS printing_jobs_vendor_id_idx ON public.printing_jobs USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS stitching_jobs_vendor_id_idx ON public.stitching_jobs USING btree (vendor_id);

-- Add comments for documentation
COMMENT ON COLUMN public.cutting_jobs.vendor_id IS 'Reference to the vendor responsible for this cutting job';
COMMENT ON COLUMN public.printing_jobs.vendor_id IS 'Reference to the vendor responsible for this printing job';
COMMENT ON COLUMN public.stitching_jobs.vendor_id IS 'Reference to the vendor responsible for this stitching job';
