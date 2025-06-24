-- Add vendor_id column to cutting_jobs table
ALTER TABLE public.cutting_jobs 
ADD COLUMN vendor_id uuid NULL;

-- Add foreign key constraint for cutting_jobs
ALTER TABLE public.cutting_jobs 
ADD CONSTRAINT cutting_jobs_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL;

-- Add index for cutting_jobs vendor_id
CREATE INDEX IF NOT EXISTS cutting_jobs_vendor_id_idx 
ON public.cutting_jobs USING btree (vendor_id);

-- Add vendor_id column to printing_jobs table
ALTER TABLE public.printing_jobs 
ADD COLUMN vendor_id uuid NULL;

-- Add foreign key constraint for printing_jobs
ALTER TABLE public.printing_jobs 
ADD CONSTRAINT printing_jobs_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL;

-- Add index for printing_jobs vendor_id
CREATE INDEX IF NOT EXISTS printing_jobs_vendor_id_idx 
ON public.printing_jobs USING btree (vendor_id);

-- Add vendor_id column to stitching_jobs table
ALTER TABLE public.stitching_jobs 
ADD COLUMN vendor_id uuid NULL;

-- Add foreign key constraint for stitching_jobs
ALTER TABLE public.stitching_jobs 
ADD CONSTRAINT stitching_jobs_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL;

-- Add index for stitching_jobs vendor_id
CREATE INDEX IF NOT EXISTS stitching_jobs_vendor_id_idx 
ON public.stitching_jobs USING btree (vendor_id);

-- Add comments for documentation
COMMENT ON COLUMN public.cutting_jobs.vendor_id IS 'Reference to vendor when job is assigned to external vendor';
COMMENT ON COLUMN public.printing_jobs.vendor_id IS 'Reference to vendor when job is assigned to external vendor';
COMMENT ON COLUMN public.stitching_jobs.vendor_id IS 'Reference to vendor when job is assigned to external vendor';
