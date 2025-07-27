-- Add rate column to cutting_jobs table
-- This allows tracking of cutting job rates for external workers

ALTER TABLE public.cutting_jobs 
ADD COLUMN rate numeric NULL;

-- Add comment to document the purpose of the rate field
COMMENT ON COLUMN public.cutting_jobs.rate IS 'Rate charged for cutting work, primarily used for external cutting jobs';

-- Create index for performance if needed for rate-based queries
CREATE INDEX IF NOT EXISTS cutting_jobs_rate_idx ON public.cutting_jobs USING btree (rate) TABLESPACE pg_default;
