
-- Create function to generate job number
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.job_number := 'JOB-' || to_char(current_date, 'YYYY') || '-' ||
        LPAD(COALESCE(
            (SELECT COUNT(*) + 1 FROM public.job_cards 
             WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
            '1'
        ), 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add job_number column to job_cards table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_attribute 
        WHERE attrelid = 'public.job_cards'::regclass
        AND attname = 'job_number'
        AND NOT attisdropped
    ) THEN
        ALTER TABLE public.job_cards ADD COLUMN job_number TEXT;
    END IF;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_job_number ON public.job_cards;

-- Create trigger
CREATE TRIGGER set_job_number
BEFORE INSERT ON public.job_cards
FOR EACH ROW
EXECUTE FUNCTION public.generate_job_number();

-- Update existing records that don't have job numbers
UPDATE public.job_cards
SET job_number = 'JOB-' || to_char(created_at, 'YYYY') || '-' || LPAD(id::text, 3, '0')
WHERE job_number IS NULL;
