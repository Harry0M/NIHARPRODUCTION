-- Migration: Add rate column to cutting_jobs table
-- This migration adds a rate field to track cutting job rates for external workers

BEGIN;

-- Add rate column to cutting_jobs table
ALTER TABLE public.cutting_jobs 
ADD COLUMN IF NOT EXISTS rate numeric;

-- Add comment to document the purpose of the rate field
COMMENT ON COLUMN public.cutting_jobs.rate IS 'Rate charged for cutting work, primarily used for external cutting jobs';

-- Create index for performance if needed for rate-based queries
CREATE INDEX IF NOT EXISTS cutting_jobs_rate_idx ON public.cutting_jobs USING btree (rate);

COMMIT;
