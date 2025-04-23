
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_job_number_on_insert ON public.job_cards;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.generate_job_number();

-- Create a proper function to generate job numbers
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.job_number := 'JOB-' || to_char(current_date, 'YYYY') || '-' ||
        LPAD(COALESCE(
            (SELECT COUNT(*) + 1 FROM public.job_cards 
             WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
            '1'
        ), 3, '0');
    RETURN NEW;
END;
$$;

-- Create a new trigger to set job_number on insert
CREATE TRIGGER set_job_number_on_insert
BEFORE INSERT ON public.job_cards
FOR EACH ROW
WHEN (NEW.job_number IS NULL)
EXECUTE FUNCTION public.generate_job_number();

-- Update existing records that might be missing job numbers
UPDATE public.job_cards 
SET job_number = 'JOB-' || to_char(created_at, 'YYYY') || '-' || 
    LPAD((
        ROW_NUMBER() OVER (
            PARTITION BY EXTRACT(YEAR FROM created_at) 
            ORDER BY created_at
        )
    )::TEXT, 3, '0')
WHERE job_number IS NULL;

COMMENT ON FUNCTION public.generate_job_number IS 'Automatically generates job numbers for new job cards';
